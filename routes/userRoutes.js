const express = require('express');
const { getAllUsers, login, registerUser, requestPasswordReset, verifyToken, resetPassword } = require('../controller/userController');

const router = express.Router();

// Route to fetch all users
router.get('/getUsers', getAllUsers);
router.post('/login', login);

// Route to register a new user
router.post('/register', registerUser);

// Solicitar código OTP para recuperar contraseña
router.post('/request-password-reset', requestPasswordReset);

// Verificar código OTP (sin cambiar contraseña)
router.post('/verify-token', verifyToken);

// Restablecer contraseña con código OTP
router.post('/reset-password', resetPassword);

module.exports = router;