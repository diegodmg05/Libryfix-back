const bcrypt = require('bcrypt');
const supabase = require('../config/supabase');
const { logger } = require('../config/logger');
const User = require('../models/User');
const { createAppError } = require('../utils/AppError');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


async function getAllUsers() {
  const { data, error } = await supabase
    .from('Users')
    .select('id, name, surname, email, rol, status, created_at');

  if (error) {
    logger.error({ error: error.message }, 'Error obteniendo usuarios');
    throw createAppError('No se pudieron obtener los usuarios', 500, error.message);
  }

  return data.map((user) => new User(user));
}

async function getUserById(id) {
  const { data, error } = await supabase
    .from('Users')
    .select('id, name, surname, email, rol, status, created_at')
    .eq('id', id)
    .single();

  if (error) {
    const err = new Error(error.message);
    err.status = 500;
    throw err;
  }

  if (!data) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  return new User(data);
}

async function deleteUser(id) {
  const { data, error } = await supabase
    .from('Users')
    .delete()
    .eq('id', id)
    .select('id, name, surname, email, rol, status, created_at')
    .single();

  if (error) {
    const err = new Error(error.message);
    err.status = 500;
    throw err;
  }

  if (!data) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  return new User(data);
}

async function createUser({ name, surname, email, password, rol }) {
  if (!name || !surname || !email || !password) {
    const err = new Error('All fields are required: name, surname, email, password');
    err.status = 400;
    throw err;
  }
  if (!EMAIL_REGEX.test(email)) {
    const err = new Error('Invalid email format');
    err.status = 400;
    throw err;
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const { data, error } = await supabase
    .from('Users')
    .insert([{ name, surname, email, password: hashedPassword, rol, status: true }])
    .select('id, name, surname, email, rol, status, created_at')
    .single();
  if (error) {
    const err = new Error(error.message);
    err.status = 500;
    throw err;
  }
  return new User(data);
}

async function updateUser({ id, name, surname, email, password, rol, status }) {
  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (surname !== undefined) updateData.surname = surname;
  if (email !== undefined) {
    if (!EMAIL_REGEX.test(email)) {
      const err = new Error('Invalid email format');
      err.status = 400;
      throw err;
    }
    updateData.email = email;
  }
  if (password !== undefined) {
    if (!password) {
      const err = new Error('Password cannot be empty');
      err.status = 400;
      throw err;
    }
    updateData.password = await bcrypt.hash(password, 10);
  }
  if (rol !== undefined) updateData.rol = rol;
  if (status !== undefined) updateData.status = status;

  const { data, error } = await supabase
    .from('Users')
    .update(updateData)
    .eq('id', id)
    .select('id, name, surname, email, rol, status, created_at')
    .single();

  if (error) {
    const err = new Error(error.message);
    err.status = 500;
    throw err;
  }

  if (!data) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  return new User(data);
}

module.exports = { getAllUsers, getUserById, updateUser, deleteUser, createUser };
