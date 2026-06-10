import 'dotenv/config'; // MUST be the first line
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Import Routes

// Import Routes
import authRoutes from './routes/auth.js';
import vehicleRoutes from './routes/vehicles.js';
import expenseRoutes from './routes/expenses.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Setup relative path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve uploads folder statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes Middleware
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/expenses', expenseRoutes);

import Expense from './models/Expense.js';

// Database Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected successfully');
    
    // Run migration query to combine 'Maintenance' and 'Service' to 'Maintenance & Service'
    try {
      const result = await Expense.updateMany(
        { category: { $in: ['Maintenance', 'Service'] } },
        { category: 'Maintenance & Service' }
      );
      if (result.modifiedCount > 0) {
        console.log(`Successfully migrated ${result.modifiedCount} expenses to "Maintenance & Service"`);
      }
    } catch (err) {
      console.error('Migration failed:', err.message);
    }

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  });

// Serve frontend in production (optional, if client build folder exists)
const clientBuildPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientBuildPath, 'index.html'), (err) => {
    if (err) {
      // If index.html doesn't exist, we are in dev mode
      res.status(200).send('API is running. Client is in dev mode.');
    }
  });
});
