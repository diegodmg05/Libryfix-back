const express = require('express');
const {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook
} = require('../controllers/bookController');

const router = express.Router();

router.get('/getBooks', getAllBooks);
router.get('/getBook/:id', getBookById);
router.post('/createBook', createBook);
router.put('/updateBook/:id', updateBook);
router.delete('/deleteBook/:id', deleteBook);

module.exports = router;
