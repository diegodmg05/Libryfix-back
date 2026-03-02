const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { generateSecret, generate, verify } = require('otplib');
const User = require('../models/User');
const { sendPasswordResetEmail } = require('../services/emailService');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SECRET_KEY_SUPABASE
);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    if (!EMAIL_REGEX.test(email)) {
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

async function requestPasswordReset (req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'El email es obligatorio' });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'Email no válido' });
    }

    const { data: user, error: userError } = await supabase
      .from('Users')
      .select('id, email')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return res.status(200).json({
        message: 'Si existe una cuenta con ese email, recibirás un código por correo.'
      });
    }

    const secret = generateSecret();
    const token = await generate({ secret, strategy: 'hotp', counter: 0 });
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutos

    const { error: insertError } = await supabase
      .from('password_reset_otps')
      .insert({ email: user.email, otp: secret, expires_at: expiresAt });

    if (insertError) {
      console.error('Error saving password reset token:', insertError);
      return res.status(500).json({ error: 'Error al guardar el token de recuperación de contraseña' });
    }

    await sendPasswordResetEmail(user.email, token);

    res.status(200).json({
      message: 'Si existe una cuenta con ese email, recibirás un código por correo.'
    });

  } catch (err) {
    console.error('Error requesting password reset:', err.message || err);
    return res.status(500).json({ error: 'Error al solicitar recuperación de contraseña' });
  }
}

async function verifyToken (req, res) {
  try {
    const { email, token } = req.body;

    if (!email || !token) {
      return res.status(400).json({ error: 'Faltan email o código' });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'Email no válido' });
    }

    const { data: otpRow, error: otpError } = await supabase
      .from('password_reset_otps')
      .select('id, otp, expires_at')
      .eq('email', email)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpError || !otpRow) {
      return res.status(200).json({ valid: false });
    }

    const secret = otpRow.otp;
    const verification = await verify({ secret, token, strategy: 'hotp', counter: 0 });
    if (verification.valid) {
      await supabase
        .from('password_reset_otps')
        .update({ used: true })
        .eq('id', otpRow.id);
    }
    return res.status(200).json({ valid: verification.valid });
  } catch (err) {
    console.error('Error verifying token:', err.message || err);
    return res.status(500).json({ error: 'Error al verificar el código' });
  }
}

async function resetPassword (req, res) {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return res.status(400).json({ error: 'Faltan email, código o nueva contraseña' });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'Email no válido' });
    }

    const { data: otpRow, error: otpError } = await supabase
      .from('password_reset_otps')
      .select('id, email, otp, expires_at')
      .eq('email', email)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpError || !otpRow) {
      return res.status(400).json({ error: 'Código no válido o expirado. Solicita uno nuevo.' });
    }

    const secret = otpRow.otp;
    const verification = await verify({ secret, token, strategy: 'hotp', counter: 0 });
    if (!verification.valid) {
      return res.status(400).json({ error: 'Código incorrecto' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    const { error: updateError } = await supabase
      .from('Users')
      .update({ password: hashedPassword })
      .eq('email', email);

    if (updateError) {
      console.error('Error updating password:', updateError);
      return res.status(500).json({ error: 'Error al actualizar la contraseña' });
    }

    await supabase
      .from('password_reset_otps')
      .delete()
      .eq('id', otpRow.id);

    res.status(200).json({ message: 'Contraseña actualizada. Ya puedes iniciar sesión.' });
  } catch (err) {
    console.error('Error resetting password:', err.message || err);
    return res.status(500).json({ error: 'Error al restablecer la contraseña' });
  }
}

module.exports = {
  getAllUsers,
  login,
  registerUser,
  requestPasswordReset,
  verifyToken,
  resetPassword
};
