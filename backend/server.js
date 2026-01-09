const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Better logging for debugging unexpected exits
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  // Don't exit on SMTP errors
  if (err.code === 'EAUTH') {
    console.log('Continuing despite SMTP authentication error...');
    return;
  }
  process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

// Middleware
app.use(cors());
app.use(express.json());

// Simple request logger to see incoming requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/locations', require('./routes/locations'));
app.use('/api/hods', require('./routes/hods'));
app.use('/api/schemes', require('./routes/schemes'));
app.use('/api/beneficiaries', require('./routes/beneficiaries'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/budget', require('./routes/budget'));
app.use('/api/programs', require('./routes/programs'));
app.use('/api/kpis', require('./routes/kpis'));
app.use('/api/nodal-officers', require('./routes/nodalOfficers'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/revenue', require('./routes/revenue'));
app.use('/api/search', require('./routes/search'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/users', require('./routes/users'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware (logs server-side errors)
app.use((err, req, res, next) => {
  console.error('Express error middleware caught:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

// Start import worker (bull) to process import jobs - non-blocking
try {
  const importQueue = require('./queues/importQueue');
  console.log('Import queue initialized');
} catch (err) {
  console.warn('Import queue not started (Redis might be unavailable):', err.message);
}

// If this file is run directly, start the HTTP server. This allows tests to import the app without listening.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
