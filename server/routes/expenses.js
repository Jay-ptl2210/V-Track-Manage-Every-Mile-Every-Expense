import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import path from 'path';
import fs from 'fs';
import Expense from '../models/Expense.js';
import Vehicle from '../models/Vehicle.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware
router.use(protect);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'vehicle_expenses',
    allowed_formats: ['jpeg', 'jpg', 'png', 'gif', 'pdf'],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
});

// Helper function to recalculate all fuel log mileages chronologically/by odometer
const recalculateMileages = async (vehicleId) => {
  try {
    const fuelLogs = await Expense.find({
      vehicle: vehicleId,
      category: 'Fuel',
      odometer: { $exists: true, $ne: null },
    }).sort({ odometer: 1 }); // Sort by odometer ascending

    for (let i = 0; i < fuelLogs.length; i++) {
      if (i === 0) {
        fuelLogs[i].mileage = null; // No previous fuel entry to calculate mileage from
      } else {
        const prevLog = fuelLogs[i - 1];
        const currLog = fuelLogs[i];
        const diffOdo = currLog.odometer - prevLog.odometer;

        if (diffOdo > 0 && currLog.fuelVolume > 0) {
          fuelLogs[i].mileage = parseFloat((diffOdo / currLog.fuelVolume).toFixed(2));
        } else {
          fuelLogs[i].mileage = null;
        }
      }
      // Save direct update to database avoiding recursive pre-save triggers
      await Expense.updateOne({ _id: fuelLogs[i]._id }, { mileage: fuelLogs[i].mileage });
    }
  } catch (error) {
    console.error('Error recalculating mileage:', error);
  }
};

// @desc    Upload an attachment
// @route   POST /api/expenses/upload
// @access  Private
router.post('/upload', upload.single('attachment'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const fileUrl = req.file.path; // Cloudinary URL
    res.json({ fileUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'File upload failed' });
  }
});

// @desc    Get all expenses for the user (with filters)
// @route   GET /api/expenses
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { vehicle, category, startDate, endDate } = req.query;
    const query = { user: req.user.id };

    if (vehicle) {
      query.vehicle = vehicle;
    }
    if (category) {
      query.category = category;
    }
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(query)
      .populate('vehicle', 'make model licensePlate')
      .sort({ date: -1, odometer: -1 });

    res.json(expenses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Create a new expense
// @route   POST /api/expenses
// @access  Private
router.post('/', async (req, res) => {
  try {
    const {
      category,
      vehicle: vehicleId,
      amount,
      date,
      notes,
      attachmentUrl,
      odometer,
      fuelVolume,
      fuelType,
      pricePerLiter,
      location,
    } = req.body;

    if (!category || !vehicleId || amount === undefined) {
      return res.status(400).json({ message: 'Please provide category, vehicle and amount' });
    }

    // Verify vehicle belongs to user
    const vehicleObj = await Vehicle.findOne({ _id: vehicleId, owner: req.user.id });
    if (!vehicleObj) {
      return res.status(404).json({ message: 'Vehicle not found or unauthorized' });
    }

    // Prep expense data
    const expenseData = {
      category,
      vehicle: vehicleId,
      user: req.user.id,
      amount: parseFloat(amount),
      date: date ? new Date(date) : undefined,
      notes,
      attachmentUrl,
    };

    if (category === 'Fuel') {
      expenseData.odometer = odometer ? parseInt(odometer, 10) : undefined;
      expenseData.fuelVolume = fuelVolume ? parseFloat(fuelVolume) : undefined;
      expenseData.fuelType = fuelType;
      expenseData.pricePerLiter = pricePerLiter ? parseFloat(pricePerLiter) : undefined;
      if (location) {
        expenseData.location = {
          latitude: location.latitude ? parseFloat(location.latitude) : undefined,
          longitude: location.longitude ? parseFloat(location.longitude) : undefined,
          address: location.address,
        };
      }
    }

    const expense = await Expense.create(expenseData);

    // If it was a fuel expense, recalculate mileages
    if (category === 'Fuel') {
      await recalculateMileages(vehicleId);
    }

    res.status(201).json(expense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Check ownership
    if (expense.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    const vehicleId = expense.vehicle;
    const isFuel = expense.category === 'Fuel';

    await expense.deleteOne();

    if (isFuel) {
      await recalculateMileages(vehicleId);
    }

    res.json({ message: 'Expense removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update an expense
// @route   PUT /api/expenses/:id
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const {
      category,
      vehicle: vehicleId,
      amount,
      date,
      notes,
      attachmentUrl,
      odometer,
      fuelVolume,
      fuelType,
      pricePerLiter,
      location,
    } = req.body;

    let expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Check ownership
    if (expense.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    const oldVehicleId = expense.vehicle;
    const oldCategory = expense.category;

    // Verify vehicle belongs to user
    if (vehicleId && vehicleId !== expense.vehicle.toString()) {
      const vehicleObj = await Vehicle.findOne({ _id: vehicleId, owner: req.user.id });
      if (!vehicleObj) {
        return res.status(404).json({ message: 'Vehicle not found or unauthorized' });
      }
      expense.vehicle = vehicleId;
    }

    if (category) {
      expense.category = category;
    }
    if (amount !== undefined) {
      expense.amount = parseFloat(amount);
    }
    if (date) {
      expense.date = new Date(date);
    }
    if (notes !== undefined) {
      expense.notes = notes;
    }
    if (attachmentUrl !== undefined) {
      expense.attachmentUrl = attachmentUrl;
    }

    // Handle Fuel-specific fields if the final category is Fuel
    if (expense.category === 'Fuel') {
      if (odometer !== undefined) {
        expense.odometer = odometer ? parseInt(odometer, 10) : undefined;
      }
      if (fuelVolume !== undefined) {
        expense.fuelVolume = fuelVolume ? parseFloat(fuelVolume) : undefined;
      }
      if (fuelType !== undefined) {
        expense.fuelType = fuelType;
      }
      if (pricePerLiter !== undefined) {
        expense.pricePerLiter = pricePerLiter ? parseFloat(pricePerLiter) : undefined;
      }
      if (location !== undefined) {
        if (location) {
          expense.location = {
            latitude: location.latitude ? parseFloat(location.latitude) : undefined,
            longitude: location.longitude ? parseFloat(location.longitude) : undefined,
            address: location.address,
          };
        } else {
          expense.location = undefined;
        }
      }
    } else {
      // Clear fuel specific fields if it's no longer a fuel expense
      expense.odometer = undefined;
      expense.fuelVolume = undefined;
      expense.fuelType = undefined;
      expense.pricePerLiter = undefined;
      expense.location = undefined;
      expense.mileage = undefined;
    }

    const updatedExpense = await expense.save();

    // Recalculate mileages if either old category or new category is Fuel
    if (oldCategory === 'Fuel' || expense.category === 'Fuel') {
      await recalculateMileages(oldVehicleId);
      if (oldVehicleId.toString() !== expense.vehicle.toString()) {
        await recalculateMileages(expense.vehicle);
      }
    }

    res.json(updatedExpense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
