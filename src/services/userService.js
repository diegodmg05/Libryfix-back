const supabase = require('../config/supabase');
const { logger } = require('../config/logger');
const User = require('../models/User');
const { createAppError } = require('../utils/AppError');

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

module.exports = { getAllUsers };
