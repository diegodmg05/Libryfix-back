const express = require('express');
const {
  register,
  login,
  requestPasswordReset,
  verifyToken,
  resetPassword,
  reactivate
} = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/request-password-reset', requestPasswordReset);
router.post('/verify-token', verifyToken);
router.post('/reset-password', resetPassword);
router.post('/reactivate', reactivate);

module.exports = router;
