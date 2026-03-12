const express = require('express');
const { getAllUsers } = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/getUsers', authMiddleware, getAllUsers);

module.exports = router;
