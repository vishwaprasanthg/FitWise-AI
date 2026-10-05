const { getDBStatus } = require('../config/db');
const { successResponse } = require('../utils/apiResponse');

const getHealthStatus = (req, res) => {
  const dbStatus = getDBStatus();
  
  const healthData = {
    status: 'healthy',
    service: 'FitPilot AI API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: dbStatus,
  };

  return successResponse(res, healthData, 'FitPilot AI API is running', 200);
};

module.exports = {
  getHealthStatus,
};
