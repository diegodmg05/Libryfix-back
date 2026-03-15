const express = require('express');
const { getAllUsers, getUserById, updateUser, deleteUser, createUser } = require('../controllers/userController');

const router = express.Router();

router.get('/getUsers', getAllUsers);
router.get('/getUser/:id', getUserById);
router.put('/updateUser/:id', updateUser);
router.delete('/deleteUser/:id', deleteUser);
router.post('/createUser', createUser);


module.exports = router;
