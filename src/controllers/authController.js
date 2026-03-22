const authService = require('../services/authService');
const { createAppError } = require('../utils/AppError');
const { EMAIL_REGEX } = require('../utils/validators');
const { logger } = require('../config/logger');

async function register(req, res, next) {
  try {
    const { name, surname, email, password } = req.body;
    if (!name || !surname || !email || !password) {
      return next(createAppError('All fields are required: name, surname, email, password', 400));
    }
    if (!EMAIL_REGEX.test(email)) {
      return next(createAppError('Invalid email format', 400));
    }

    logger.info({ ip: req.ip, route: req.originalUrl, name, email }, 'Register attempt');

    const user = await authService.registerUser({ name, surname, email, password });
    logger.info({ userId: user.id, email: user.email }, 'User registered successfully');
    res.status(201).json({ message: 'User registered successfully', user });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(createAppError('Email and password are required', 400));
    }

    logger.info({ ip: req.ip, route: req.originalUrl, email }, 'Login attempt');

    const { token, user } = await authService.loginUser({ email, password });
    logger.info({ userId: user.id, email: user.email }, 'Login successful');
    res.status(200).json({ message: 'Login successful', token, user });
  } catch (err) {
    next(err);
  }
}

async function requestPasswordReset(req, res, next) {
  try {
    const { email } = req.body;

    if (!email) return next(createAppError('Email is required', 400));
    if (!EMAIL_REGEX.test(email)) return next(createAppError('Invalid email format', 400));

    logger.info({ ip: req.ip, route: req.originalUrl, email }, 'Password reset requested');
    await authService.requestPasswordReset(email);
    logger.info({ email }, 'Password reset process initiated (silencioso si no existe cuenta)');
    res.status(200).json({ message: 'If an account exists with that email, you will receive a code.' });
  } catch (err) {
    next(err);
  }
}

async function verifyToken(req, res, next) {
  try {
    const { email, token } = req.body;

    if (!email || !token) return next(createAppError('Email and code are required', 400));
    if (!EMAIL_REGEX.test(email)) return next(createAppError('Invalid email format', 400));

    logger.info({ ip: req.ip, route: req.originalUrl, email }, 'OTP verification attempt');
    const valid = await authService.verifyOtp(email, token);
    logger.info({ email, valid }, 'OTP verification result');
    res.status(200).json({ valid });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return next(createAppError('Email, code and new password are required', 400));
    }
    if (!EMAIL_REGEX.test(email)) return next(createAppError('Invalid email format', 400));

    logger.info({ ip: req.ip, route: req.originalUrl, email }, 'Password reset attempt');
    await authService.resetPassword(email, token, newPassword);
    logger.info({ email }, 'Password reset successful');
    res.status(200).json({ message: 'Password updated. You can now sign in.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, requestPasswordReset, verifyToken, resetPassword };
