const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const { logger } = require('../config/logger');
const User = require('../models/User');
const { createAppError } = require('../utils/AppError');
const { sendPasswordResetEmail } = require('./emailService');

async function registerUser({ name, surname, email, password }) {
  const { data: existingUser, error: existingUserError } = await supabase
    .from('Users')
    .select('email')
    .eq('email', email)
    .maybeSingle();

  if (existingUserError) {
    logger.error({ email, error: existingUserError.message }, 'Error buscando usuario existente por email');
    throw createAppError('No se pudo verificar el email del usuario', 500, existingUserError.message);
  }

  if (existingUser) {
    logger.warn({ email }, 'Registro rechazado: email ya registrado');
    throw createAppError('Email already registered', 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const { data, error: userError } = await supabase
    .from('Users')
    .insert([{ name, surname, email, password: hashedPassword, rol: 2, status: true }])
    .select('id, name, surname, email, password, rol, status, created_at');

  if (userError) {
    logger.error({ email, error: userError.message }, 'Error al registrar usuario en base de datos');
    throw createAppError('No se pudo registrar el usuario', 500, userError.message);
  }

  return new User(data[0]);
}

async function loginUser({ email, password }) {
  const { data, error: userError } = await supabase
    .from('Users')
    .select('id, name, surname, email, password, rol, status, created_at')
    .eq('email', email)
    .single();

  if (userError || !data) {
    logger.warn({ email }, 'Login fallido: credenciales inválidas (usuario no encontrado)');
    throw createAppError('Invalid email or password', 401);
  }

  const isPasswordValid = await bcrypt.compare(password, data.password);
  
  if (!isPasswordValid) {
    logger.warn({ email }, 'Login fallido: contraseña inválida');
    throw createAppError('Invalid email or password', 401);
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
  const { data: user, error: userError } = await supabase
    .from('Users')
    .select('id, email')
    .eq('email', email)
    .maybeSingle();

  if (userError) {
    logger.error({ email, error: userError.message }, 'Error buscando usuario para recuperación de contraseña');
    throw createAppError('No se pudo iniciar la recuperación de contraseña', 500, userError.message);
  }
  // Silencioso para evitar enumeración de usuarios
  if (!user) {
    logger.info({ email }, 'Solicitud de recuperación para email no registrado');
    return;
  }

  const token = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from('password_reset_otps')
    .insert({ email: user.email, otp: token, expires_at: expiresAt });

  if (error) {
    logger.error({ email: user.email, error: error.message }, 'Error guardando OTP de recuperación');
    throw createAppError('No se pudo generar el código de recuperación', 500, error.message);
  }

  await sendPasswordResetEmail(user.email, token);
}

async function verifyOtp(email, token) {
  const { data: otpRow, error: otpError } = await supabase
    .from('password_reset_otps')
    .select('id, otp, expires_at')
    .eq('email', email)
    .eq('used', false)
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (otpError) {
    logger.error({ email, error: otpError.message }, 'Error verificando OTP en base de datos');
    return false;
  }

  if (!otpRow) {
    logger.warn({ email }, 'Verificación OTP sin código válido activo');
    return false;
  }

  return otpRow.otp === token;
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
    if (otpError) {
      logger.error({ email, error: otpError.message }, 'Error consultando OTP para resetear contraseña');
    } else {
      logger.warn({ email }, 'Reseteo rechazado: OTP inválido o expirado');
    }
    throw createAppError('Invalid or expired code. Request a new one.', 400);
  }

  const isValid = otpRow.otp === token;
  if (!isValid) {
    logger.warn({ email }, 'Reseteo rechazado: código OTP inválido');
    throw createAppError('Invalid code', 400);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const { error: updateError } = await supabase
    .from('Users')
    .update({ password: hashedPassword })
    .eq('email', email);

  if (updateError) {
    logger.error({ email, error: updateError.message }, 'Error actualizando contraseña');
    throw createAppError('No se pudo actualizar la contraseña', 500, updateError.message);
  }

  // Marcar como usado para trazabilidad
  const { error: markUsedError } = await supabase
    .from('password_reset_otps')
    .update({ used: true })
    .eq('id', otpRow.id);

  if (markUsedError) {
    logger.error({ email, error: markUsedError.message }, 'Contraseña actualizada, pero no se pudo marcar el OTP como usado');
    throw createAppError('No se pudo finalizar el proceso de recuperación', 500, markUsedError.message);
  }
}

async function reactivateAccount(email, password) {
  const { data: user, error: userError } = await supabase
    .from('Users')
    .select('id, email, status')
    .eq('email', email)
    .maybeSingle();

  if (userError) {
    logger.error({ email, error: userError.message }, 'Error buscando usuario para reactivación');
    throw createAppError('No se pudo verificar el usuario', 500, userError.message);
  }

  if (!user) {
    logger.warn({ email }, 'Reactivación rechazada: usuario no encontrado');
    throw createAppError('Account not found', 404);
  }

  if (user.status === true) {
    logger.warn({ email }, 'Reactivación rechazada: cuenta ya está activa');
    throw createAppError('Account is already active', 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const { error: updateError } = await supabase
    .from('Users')
    .update({ status: true, password: hashedPassword })
    .eq('email', email);

  if (updateError) {
    logger.error({ email, error: updateError.message }, 'Error reactivando cuenta');
    throw createAppError('No se pudo reactivar la cuenta', 500, updateError.message);
  }

  logger.info({ email }, 'Cuenta reactivada exitosamente');
}

module.exports = { registerUser, loginUser, requestPasswordReset, verifyOtp, resetPassword, reactivateAccount };
