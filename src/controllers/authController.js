const authService = require('../services/authService');
const { EMAIL_REGEX } = require('../utils/validators');

async function register(req, res, next) {
  try {
    const { name, surname, email, password } = req.body;

    if (!name || !surname || !email || !password) {
      return res.status(400).json({ error: 'All fields are required: name, surname, email, password' });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const user = await authService.registerUser({ name, surname, email, password });
    res.status(201).json({ message: 'User registered successfully', user });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { token, user } = await authService.loginUser({ email, password });
    res.status(200).json({ message: 'Login successful', token, user });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
}

async function requestPasswordReset(req, res, next) {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ error: 'Email is required' });
    if (!EMAIL_REGEX.test(email)) return res.status(400).json({ error: 'Invalid email format' });

    await authService.requestPasswordReset(email);
    res.status(200).json({ message: 'If an account exists with that email, you will receive a code.' });
  } catch (err) {
    next(err);
  }
}

async function verifyToken(req, res, next) {
  try {
    const { email, token } = req.body;

    if (!email || !token) return res.status(400).json({ error: 'Email and code are required' });
    if (!EMAIL_REGEX.test(email)) return res.status(400).json({ error: 'Invalid email format' });

    const valid = await authService.verifyOtp(email, token);
    res.status(200).json({ valid });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return res.status(400).json({ error: 'Email, code and new password are required' });
    }
    if (!EMAIL_REGEX.test(email)) return res.status(400).json({ error: 'Invalid email format' });

    await authService.resetPassword(email, token, newPassword);
    res.status(200).json({ message: 'Password updated. You can now sign in.' });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
}

module.exports = { register, login, requestPasswordReset, verifyToken, resetPassword };
