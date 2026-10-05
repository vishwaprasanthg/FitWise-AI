const logger = require('../utils/logger');
const { errorResponse } = require('../utils/apiResponse');

/**
 * Global Centralized Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  logger.error(`Error processing request [${req.method} ${req.originalUrl}]:`, err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return errorResponse(res, messages.join(', '), 400, err);
  }

  // Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return errorResponse(res, `A record with this ${field} already exists.`, 409, err);
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return errorResponse(res, `Resource not found with id: ${err.value}`, 404, err);
  }

  // Zod validation error
  if (err.name === 'ZodError') {
    const errorDetails = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    return errorResponse(res, `Validation failed: ${errorDetails}`, 400, err);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 'Invalid authentication token', 401, err);
  }
  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 'Authentication token has expired', 401, err);
  }

  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : (statusCode === 500 ? 'Internal Server Error' : err.message);

  return errorResponse(res, message, statusCode, err);
};

module.exports = errorHandler;
