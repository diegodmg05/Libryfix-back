const categoriesService = require('../services/categoriesService');
const { createAppError } = require('../utils/AppError');
const { logger } = require('../config/logger');

async function getAllCategories(req, res, next) {
  try {
    logger.info({ requester: req.user ? req.user.id : null, route: req.originalUrl }, 'Get all categories request');
    const categories = await categoriesService.getAllCategories();
    logger.info({ requester: req.user ? req.user.id : null, count: categories.length }, 'Returned categories list');
    res.status(200).json(categories);
  } catch (err) {
    next(err);
  }
}

async function getCategoryById(req, res, next) {
  try {
    const category = await categoriesService.getCategoryById(req.params.id);
    res.status(200).json(category);
  } catch (err) {
    next(err);
  }
}

async function createCategory(req, res, next) {
  try {
    const { name, description } = req.body;

    if (!name) {
      return next(createAppError('Category name is required', 400));
    }

    const category = await categoriesService.createCategory({ name, description });
    res.status(201).json({ message: 'Category created successfully', category });
  } catch (err) {
    next(err);
  }
}

async function updateCategory(req, res, next) {
  try {
    const { name, description } = req.body;

    if (name === undefined && description === undefined) {
      return next(createAppError('At least one field is required to update the category', 400));
    }

    const category = await categoriesService.updateCategory({
      id: req.params.id,
      name,
      description
    });

    res.status(200).json(category);
  } catch (err) {
    next(err);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const category = await categoriesService.deleteCategory(req.params.id);
    res.status(200).json({ message: 'Category deleted successfully', category });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};
