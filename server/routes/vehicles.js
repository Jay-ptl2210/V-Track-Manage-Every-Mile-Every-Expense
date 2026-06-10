import express from 'express';
import Vehicle from '../models/Vehicle.js';
import Expense from '../models/Expense.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to all vehicle routes
router.use(protect);

// @desc    Get all vehicles for current user
// @route   GET /api/vehicles
// @access  Private
router.get('/', async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json(vehicles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Create a new vehicle
// @route   POST /api/vehicles
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { make, model, licensePlate, year, fuelType } = req.body;

    if (!make || !model || !licensePlate) {
      return res.status(400).json({ message: 'Please provide make, model and license plate' });
    }

    const vehicle = await Vehicle.create({
      make,
      model,
      licensePlate,
      year: year ? parseInt(year, 10) : undefined,
      fuelType: fuelType || 'Petrol',
      owner: req.user.id,
    });

    res.status(201).json(vehicle);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Delete a vehicle
// @route   DELETE /api/vehicles/:id
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    // Check if vehicle belongs to current user
    if (vehicle.owner.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    // Delete vehicle
    await vehicle.deleteOne();

    // Also delete all expenses related to this vehicle
    await Expense.deleteMany({ vehicle: req.params.id });

    res.json({ message: 'Vehicle and its associated expenses removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update a vehicle
// @route   PUT /api/vehicles/:id
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const { make, model, licensePlate, year, fuelType } = req.body;
    let vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    // Check if vehicle belongs to current user
    if (vehicle.owner.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    vehicle.make = make !== undefined ? make : vehicle.make;
    vehicle.model = model !== undefined ? model : vehicle.model;
    vehicle.licensePlate = licensePlate !== undefined ? licensePlate : vehicle.licensePlate;
    vehicle.year = year !== undefined ? (year ? parseInt(year, 10) : undefined) : vehicle.year;
    vehicle.fuelType = fuelType !== undefined ? fuelType : vehicle.fuelType;

    const updatedVehicle = await vehicle.save();
    res.json(updatedVehicle);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
