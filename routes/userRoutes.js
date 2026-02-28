const express = require('express');
const { getAllUsers, login } = require('../controller/userController');

const router = express.Router();

// Route to fetch all users
router.get('/getUsers', getAllUsers);
router.post('/login', login);

module.exports = router;