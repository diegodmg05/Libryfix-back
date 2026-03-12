const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { hotp, authenticator } = require('otplib');
const supabase = require('../config/supabase');
const User = require('../models/User');
const { sendPasswordResetEmail } = require('./emailService');

async function registerUser({ name, surname, email, password }) {
  const { data: existingUser } = await supabase
    .from('Users')
    .select('email')
    .eq('email', email)
    .single();

  if (existingUser) {
    const err = new Error('Email already registered');
    err.status = 409;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const { data, error } = await supabase
    .from('Users')
    .insert([{ name, surname, email, password: hashedPassword, rol: 2, status: true }])
    .select('id, name, surname, email, password, rol, status, created_at');

  if (error) {
    const err = new Error(error.message);
    err.status = 500;
    throw err;
  }

  return new User(data[0]);
}

async function loginUser({ email, password }) {
  const { data, error } = await supabase
    .from('Users')
    .select('id, name, surname, email, password, rol, status, created_at')
    .eq('email', email)
    .single();

  if (error || !data) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  const isPasswordValid = await bcrypt.compare(password, data.password);
  if (!isPasswordValid) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  const user = new User(data);
  const token = jwt.sign(
    { id: user.id, email: user.email, rol: user.rol },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  return { token, user };
}

async function requestPasswordReset(email) {
  const { data: user } = await supabase
    .from('Users')
    .select('id, email')
    .eq('email', email)
    .single();

  // Silencioso para evitar enumeración de usuarios
  if (!user) return;

  const secret = authenticator.generateSecret();
  const token = hotp.generate(secret, 0);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from('password_reset_otps')
    .insert({ email: user.email, otp: secret, expires_at: expiresAt });

  if (error) {
    const err = new Error(error.message);
    err.status = 500;
    throw err;
  }

  await sendPasswordResetEmail(user.email, token);
}

async function verifyOtp(email, token) {
  const { data: otpRow } = await supabase
    .from('password_reset_otps')
    .select('id, otp, expires_at')
    .eq('email', email)
    .eq('used', false)
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!otpRow) return false;

  return hotp.verify({ token, secret: otpRow.otp, counter: 0 });
}

async function resetPassword(email, token, newPassword) {
  const { data: otpRow, error: otpError } = await supabase
    .from('password_reset_otps')
    .select('id, email, otp, expires_at')
    .eq('email', email)
    .eq('used', false)
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (otpError || !otpRow) {
    const err = new Error('Invalid or expired code. Request a new one.');
    err.status = 400;
    throw err;
  }

  const isValid = hotp.verify({ token, secret: otpRow.otp, counter: 0 });
  if (!isValid) {
    const err = new Error('Invalid code');
    err.status = 400;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const { error: updateError } = await supabase
    .from('Users')
    .update({ password: hashedPassword })
    .eq('email', email);

  if (updateError) {
    const err = new Error(updateError.message);
    err.status = 500;
    throw err;
  }

  // Marcar como usado para trazabilidad
  await supabase
    .from('password_reset_otps')
    .update({ used: true })
    .eq('id', otpRow.id);
}

module.exports = { registerUser, loginUser, requestPasswordReset, verifyOtp, resetPassword };
