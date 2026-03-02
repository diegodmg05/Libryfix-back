const { createClient } = require('@supabase/supabase-js');
const User = require('../models/User');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SECRET_KEY_SUPABASE
);

async function getAllUsers(req, res) {
  try {
    const { data, error } = await supabase
      .from('Users')
      .select('id, name, surname, email, password, rol, status, created_at');

    if (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ error: 'Error fetching users' });
    }

    const users = data.map(user => new User(user));
    console.log('Fetched users:', users);
    res.status(200).json(users);
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'Unexpected server error' });
  }
}

module.exports = {
  getAllUsers
};
