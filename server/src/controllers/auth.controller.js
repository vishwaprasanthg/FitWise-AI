const authService = require('../services/auth.service');
const { successResponse } = require('../utils/apiResponse');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const { user, token } = await authService.registerUser({ name, email, password });

    // Set secure HttpOnly cookie
    res.cookie('token', token, authService.getCookieOptions());

    return successResponse(
      res,
      { user, token },
      'Registration successful! Welcome to FitPilot AI.',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await authService.loginUser({ email, password });

    // Set secure HttpOnly cookie
    res.cookie('token', token, authService.getCookieOptions());

    return successResponse(
      res,
      { user, token },
      'Login successful! Welcome back.',
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user & clear cookie
 * @route   POST /api/auth/logout
 * @access  Public / Authenticated
 */
const logout = async (req, res) => {
  const cookieOptions = authService.getCookieOptions();
  res.clearCookie('token', {
    httpOnly: cookieOptions.httpOnly,
    secure: cookieOptions.secure,
    sameSite: cookieOptions.sameSite,
    path: '/',
  });

  return successResponse(res, null, 'Logged out successfully', 200);
};

/**
 * @desc    Get currently authenticated user profile
 * @route   GET /api/auth/me
 * @access  Private (Protected by JWT)
 */
const getMe = async (req, res, next) => {
  try {
    const user = await authService.getUserProfile(req.user.id);
    return successResponse(res, { user }, 'Current user profile retrieved', 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
};
