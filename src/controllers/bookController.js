const bookService = require('../services/bookService');
const { createAppError } = require('../utils/AppError');
const { logger } = require('../config/logger');

async function getAllBooks(req, res, next) {
  try {
    logger.info({ requester: req.user ? req.user.id : null, route: req.originalUrl }, 'Get all books request');
    const books = await bookService.getAllBooks();
    logger.info({ requester: req.user ? req.user.id : null, count: books.length }, 'Returned books list');
    res.status(200).json(books);
  } catch (err) {
    next(err);
  }
}

async function getBookById(req, res, next) {
  try {
    const book = await bookService.getBookById(req.params.id);
    res.status(200).json(book);
  } catch (err) {
    next(err);
  }
}

async function createBook(req, res, next) {
  try {
    const { title, author, description, price, stock, image_url, category_id, status } = req.body;

    if (!title || !author || !description || price === undefined || !category_id || status === undefined) {
      return next(createAppError('title, author, description, price, category_id and status are required', 400));
    }

    const book = await bookService.createBook({
      title,
      author,
      description,
      price,
      stock,
      image_url,
      category_id,
      status
    });

    res.status(201).json({ message: 'Book created successfully', book });
  } catch (err) {
    next(err);
  }
}

async function updateBook(req, res, next) {
  try {
    const { title, author, description, price, stock, image_url, category_id, status } = req.body;

    if (
      title === undefined &&
      author === undefined &&
      description === undefined &&
      price === undefined &&
      stock === undefined &&
      image_url === undefined &&
      category_id === undefined &&
      status === undefined
    ) {
      return next(createAppError('At least one field is required to update the book', 400));
    }

    const book = await bookService.updateBook({
      id: req.params.id,
      title,
      author,
      description,
      price,
      stock,
      image_url,
      category_id,
      status
    });

    res.status(200).json(book);
  } catch (err) {
    next(err);
  }
}

async function deleteBook(req, res, next) {
  try {
    const book = await bookService.deleteBook(req.params.id);
    res.status(200).json({ message: 'Book deleted successfully', book });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook
};
