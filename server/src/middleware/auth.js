const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { errorResponse } = require('../utils/apiResponse');

/**
 * Authentication Middleware
 * Validates JWT from HttpOnly cookie or Authorization Bearer header.
 * Attaches minimal verified identity { id, email } to req.user.
 */
const protect = (req, res, next) => {
  let token = null;

  // 1. Check HttpOnly cookie
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // 2. Fallback to Authorization Header: Bearer <token>
  else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return errorResponse(
      res,
      'Authentication required. Please log in to access this resource.',
      401
    );
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    
    // Attach lightweight verified user identity
    req.user = {
      id: decoded.id,
      email: decoded.email,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Session expired. Please log in again.', 401);
    }
    return errorResponse(res, 'Invalid authentication token. Access denied.', 401);
  }
};

module.exports = {
  protect,
};
