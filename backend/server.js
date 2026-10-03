const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { initDatabase, getDbMode } = require('./config/db');
const ticketRoutes = require('./routes/ticketRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Request logging in development
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    databaseMode: getDbMode() || 'initializing',
    service: 'Support / Complaint Ticket System API'
  });
});

// Mount Ticket API routes
app.use('/api/tickets', ticketRoutes);

// 404 handler for undefined API routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} not found.`
  });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: 'An unexpected internal server error occurred.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server after verifying DB connection
async function startServer() {
  try {
    console.log('Connecting to database...');
    await initDatabase();

    const server = app.listen(PORT, () => {
      console.log(`🚀 Support Ticket Backend API is running on http://localhost:${PORT}`);
      console.log(`📦 Database Mode: ${getDbMode()}`);
      console.log(`🔍 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`📋 Tickets Endpoint: http://localhost:${PORT}/api/tickets`);
    });

    return server;
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
