const express = require('express');
const { getAllUsers, login, registerUser } = require('../controller/userController');

const router = express.Router();

// Route to fetch all users
router.get('/getUsers', getAllUsers);
router.post('/login', login);

// Route to register a new user
router.post('/register', registerUser);

module.exports = router;