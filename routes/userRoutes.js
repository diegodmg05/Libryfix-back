const express = require('express');
const { getAllUsers } = require('../controller/userController');

const router = express.Router();

// Route to fetch all users
router.get('/getUsers', getAllUsers);

module.exports = router;