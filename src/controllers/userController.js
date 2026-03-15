const userService = require('../services/userService');

async function getAllUsers(req, res, next) {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
}

async function getUserById(req, res, next) {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const user = await userService.updateUser({ ...req.body, id: req.params.id });
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}


async function deleteUser(req, res, next) {
  try{
    const user = await userService.deleteUser(req.params.id);
    res.status(200).json({ message: 'User deleted successfully', user });
  }catch(err){
    next(err);
  }
}

async function createUser(req, res, next) {
  try{
    const { name, surname, email, password, rol } = req.body;
    const user = await userService.createUser({ name, surname, email, password, rol });
    res.status(201).json({ message: 'User created successfully', user });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllUsers, getUserById, updateUser, deleteUser, createUser };
