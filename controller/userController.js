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
    res.status(200).json(users);
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'Unexpected server error' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const { data, error } = await supabase
      .from('Users')
      .select('id, name, surname, email, password, rol, status, created_at')
      .eq('email', email)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return res.status(404).json({ error: 'User not found' });
    }

    if (data.password === password) {
      const user = new User(data);
      res.status(200).json({ message: 'Login successful', user });
    } else {
      res.status(401).json({ error: 'Invalid password' });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
}

module.exports = {
  getAllUsers,
  login
};
