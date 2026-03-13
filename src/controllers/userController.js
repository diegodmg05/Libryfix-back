const userService = require('../services/userService');
const { logger } = require('../config/logger');

async function getAllUsers(req, res, next) {
  try {
    logger.info({ requester: req.user ? req.user.id : null, route: req.originalUrl }, 'Get all users request');
    const users = await userService.getAllUsers();
    logger.info({ requester: req.user ? req.user.id : null, count: users.length }, 'Returned users list');
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllUsers };
