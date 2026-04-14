const supabase = require('../config/supabase');
const { logger } = require('../config/logger');
const { createAppError } = require('../utils/AppError');
const Book = require('../models/Book');

async function ensureCategoryExists(categoryId) {
  const { data, error } = await supabase
    .from('Categories')
    .select('id')
    .eq('id', categoryId)
    .maybeSingle();

  if (error) {
    logger.error({ categoryId, error: error.message }, 'Error validating category for book');
    throw createAppError('Could not validate category', 500, error.message);
  }

  if (!data) {
    throw createAppError('Category not found', 404);
  }
}

async function getAllBooks() {
  const { data, error } = await supabase
    .from('Books')
    .select('id, title, author, description, price, stock, image_url, category_id, status, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    logger.error({ error: error.message }, 'Error getting books');
    throw createAppError('Could not get books', 500, error.message);
  }

  return data.map((book) => new Book(book));
}

async function getBookById(id) {
  const { data, error } = await supabase
    .from('Books')
    .select('id, title, author, description, price, stock, image_url, category_id, status, created_at')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    logger.error({ id, error: error.message }, 'Error getting book by id');
    throw createAppError('Could not get book', 500, error.message);
  }

  if (!data) {
    throw createAppError('Book not found', 404);
  }

  return new Book(data);
}

async function createBook({ title, author, description, price, stock, image_url, category_id, status }) {
  await ensureCategoryExists(category_id);

  const payload = {
    title,
    author,
    description,
    price,
    stock: stock ?? 0,
    image_url: image_url ?? 'https://cdn-icons-png.flaticon.com/512/171/171322.png',
    category_id,
    status
  };

  const { data, error } = await supabase
    .from('Books')
    .insert([payload])
    .select('id, title, author, description, price, stock, image_url, category_id, status, created_at')
    .single();

  if (error) {
    logger.error({ title, error: error.message }, 'Error creating book');
    throw createAppError('Could not create book', 500, error.message);
  }

  return new Book(data);
}

async function updateBook({ id, title, author, description, price, stock, image_url, category_id, status }) {
  const updateData = {};

  if (title !== undefined) updateData.title = title;
  if (author !== undefined) updateData.author = author;
  if (description !== undefined) updateData.description = description;
  if (price !== undefined) updateData.price = price;
  if (stock !== undefined) updateData.stock = stock;
  if (image_url !== undefined) updateData.image_url = image_url;
  if (status !== undefined) updateData.status = status;

  if (category_id !== undefined) {
    await ensureCategoryExists(category_id);
    updateData.category_id = category_id;
  }

  const { data, error } = await supabase
    .from('Books')
    .update(updateData)
    .eq('id', id)
    .select('id, title, author, description, price, stock, image_url, category_id, status, created_at')
    .maybeSingle();

  if (error) {
    logger.error({ id, error: error.message }, 'Error updating book');
    throw createAppError('Could not update book', 500, error.message);
  }

  if (!data) {
    throw createAppError('Book not found', 404);
  }

  return new Book(data);
}

async function deleteBook(id) {
  const { data, error } = await supabase
    .from('Books')
    .delete()
    .eq('id', id)
    .select('id, title, author, description, price, stock, image_url, category_id, status, created_at')
    .maybeSingle();

  if (error) {
    logger.error({ id, error: error.message }, 'Error deleting book');
    throw createAppError('Could not delete book', 500, error.message);
  }

  if (!data) {
    throw createAppError('Book not found', 404);
  }

  return new Book(data);
}

module.exports = {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook
};
