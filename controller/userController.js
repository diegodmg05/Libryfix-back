const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
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

async function registerUser(req, res) {
  try {
    const { name, surname, email, password } = req.body;

    // Validate that all required fields are present
    if (!name || !surname || !email || !password) {
      return res.status(400).json({ 
        error: 'All fields are required: name, surname, email, password' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if email already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('Users')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password before saving
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user with default values for rol and status
    const { data, error } = await supabase
      .from('Users')
      .insert([
        {
          name,
          surname,
          email,
          password: hashedPassword,
          rol: 2, // Default role for new users
          status: true // Default status for new users
        }
      ])
      .select('id, name, surname, email, password, rol, status, created_at');

    if (error) {
      console.error('Error registering user:', error);
      return res.status(500).json({ error: 'Error registering user', details: error.message });
    }

    const user = new User(data[0]);
    
    console.log('User registered successfully');
    res.status(201).json({ 
      message: 'User registered successfully',
      user: user
    });
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

    if (error || !data) {
      console.error('Error fetching user:', error);
      return res.status(404).json({ error: 'User not found' });
    }

    // Compare hashed password with provided password
    const isPasswordValid = await bcrypt.compare(password, data.password);
    
    if (isPasswordValid) {
      const user = new User(data);
      const token = jwt.sign(
        { id: user.id, email: user.email, rol: user.rol },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      res.status(200).json({ message: 'Login successful', token, user });
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
  login,
  registerUser
};
