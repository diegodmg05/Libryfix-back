const express = require('express');
const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoriesController');

const router = express.Router();

router.get('/getCategories', getAllCategories);
router.get('/getCategory/:id', getCategoryById);
router.post('/createCategory', createCategory);
router.put('/updateCategory/:id', updateCategory);
router.delete('/deleteCategory/:id', deleteCategory);

module.exports = router;
