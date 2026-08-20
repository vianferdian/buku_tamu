const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging (simple)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Import Routes
const authRoutes = require('./routes/auth');
const departmentRoutes = require('./routes/departments');
const employeeRoutes = require('./routes/employees');
const visitorTypeRoutes = require('./routes/visitor-types');
const visitPurposeRoutes = require('./routes/visit-purposes');
const visitRoutes = require('./routes/visits');
const settingRoutes = require('./routes/settings');
const userRoutes = require('./routes/users');
const reportRoutes = require('./routes/reports');

// Register Routes
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/visitor-types', visitorTypeRoutes);
app.use('/api/visit-purposes', visitPurposeRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);

// Base Route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Buku Tamu Digital SMK Negeri 1 Cirebon API.' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Terjadi kesalahan internal pada server.' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
// Trigger nodemon reload on port update
