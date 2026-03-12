const supabase = require('../config/supabase');
const User = require('../models/User');

async function getAllUsers() {
  const { data, error } = await supabase
    .from('Users')
    .select('id, name, surname, email, password, rol, status, created_at');

  if (error) {
    const err = new Error(error.message);
    err.status = 500;
    throw err;
  }

  return data.map((user) => new User(user));
}

module.exports = { getAllUsers };
