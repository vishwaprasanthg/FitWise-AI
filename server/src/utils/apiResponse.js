/**
 * Standard API Response Builders for FitPilot AI
 */

const successResponse = (res, data = {}, message = 'Operation successful', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const errorResponse = (res, message = 'An error occurred', statusCode = 500, error = null) => {
  const responsePayload = {
    success: false,
    message,
  };

  if (error && process.env.NODE_ENV !== 'production') {
    responsePayload.error = typeof error === 'string' ? error : error.message || error;
  }

  return res.status(statusCode).json(responsePayload);
};

module.exports = {
  successResponse,
  errorResponse,
};
