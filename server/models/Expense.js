import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  latitude: { type: Number },
  longitude: { type: Number },
  address: { type: String, trim: true },
}, { _id: false });

const expenseSchema = new mongoose.Schema({
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Fuel', 'Maintenance & Service', 'Fastag', 'Other'],
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: [true, 'Vehicle is required'],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative'],
  },
  date: {
    type: Date,
    default: Date.now,
    required: true,
  },
  notes: {
    type: String,
    trim: true,
  },
  attachmentUrl: {
    type: String,
  },
  // Fuel-specific fields
  odometer: {
    type: Number,
    min: [0, 'Odometer cannot be negative'],
  },
  fuelVolume: {
    type: Number,
    min: [0.01, 'Fuel volume must be positive'],
  },
  fuelType: {
    type: String,
    trim: true,
  },
  pricePerLiter: {
    type: Number,
    min: [0, 'Price cannot be negative'],
  },
  location: {
    type: locationSchema,
  },
  mileage: {
    type: Number, // Calculated: (Current Odo - Previous Odo) / Current Fuel Volume (L)
  },
}, {
  timestamps: true,
});

const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;
