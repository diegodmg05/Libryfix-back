const supabase = require('../config/supabase');
const { logger } = require('../config/logger');
const { createAppError } = require('../utils/AppError');

async function getAllCategories() {
  const { data, error } = await supabase
    .from('Categories')
    .select('id, name, description, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    logger.error({ error: error.message }, 'Error getting categories');
    throw createAppError('Could not get categories', 500, error.message);
  }

  return data;
}

async function getCategoryById(id) {
  const { data, error } = await supabase
    .from('Categories')
    .select('id, name, description, created_at')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    logger.error({ id, error: error.message }, 'Error getting category by id');
    throw createAppError('Could not get category', 500, error.message);
  }

  if (!data) {
    throw createAppError('Category not found', 404);
  }

  return data;
}

async function createCategory({ name, description }) {
  const { data: existingCategory, error: existingCategoryError } = await supabase
    .from('Categories')
    .select('id')
    .ilike('name', name)
    .maybeSingle();

  if (existingCategoryError) {
    logger.error({ name, error: existingCategoryError.message }, 'Error checking existing category');
    throw createAppError('Could not validate category name', 500, existingCategoryError.message);
  }

  if (existingCategory) {
    throw createAppError('Category already exists', 409);
  }

  const { data, error } = await supabase
    .from('Categories')
    .insert([{ name, description: description ?? null }])
    .select('id, name, description, created_at')
    .single();

  if (error) {
    logger.error({ name, error: error.message }, 'Error creating category');
    throw createAppError('Could not create category', 500, error.message);
  }

  return data;
}

async function updateCategory({ id, name, description }) {
  const updateData = {};

  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;

  if (name !== undefined) {
    const { data: existingCategory, error: existingCategoryError } = await supabase
      .from('Categories')
      .select('id')
      .ilike('name', name)
      .neq('id', id)
      .maybeSingle();

    if (existingCategoryError) {
      logger.error({ id, name, error: existingCategoryError.message }, 'Error checking category name before update');
      throw createAppError('Could not validate category name', 500, existingCategoryError.message);
    }

    if (existingCategory) {
      throw createAppError('Category already exists', 409);
    }
  }

  const { data, error } = await supabase
    .from('Categories')
    .update(updateData)
    .eq('id', id)
    .select('id, name, description, created_at')
    .maybeSingle();

  if (error) {
    logger.error({ id, error: error.message }, 'Error updating category');
    throw createAppError('Could not update category', 500, error.message);
  }

  if (!data) {
    throw createAppError('Category not found', 404);
  }

  return data;
}

async function deleteCategory(id) {
  const { data, error } = await supabase
    .from('Categories')
    .delete()
    .eq('id', id)
    .select('id, name, description, created_at')
    .maybeSingle();

  if (error) {
    logger.error({ id, error: error.message }, 'Error deleting category');
    throw createAppError('Could not delete category', 500, error.message);
  }

  if (!data) {
    throw createAppError('Category not found', 404);
  }

  return data;
}

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};
