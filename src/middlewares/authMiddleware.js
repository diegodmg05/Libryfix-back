const jwt = require('jsonwebtoken');
const { createAppError } = require('../utils/AppError');

/**
 * Middleware que verifica el JWT en la cabecera Authorization.
 * Adjunta el payload decodificado en req.user.
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(createAppError('No se ha proporcionado un token de autenticación', 401));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return next(createAppError('Token inválido o expirado', 401));
  }
}

module.exports = authMiddleware;
