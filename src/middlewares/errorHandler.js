/**
 * Manejador global de errores de Express.
 * Captura cualquier error no controlado lanzado con next(err).
 */
// eslint-disable-next-line no-unused-vars
const { logger } = require('../config/logger');

function errorHandler(err, req, res, next) {
  const status = Number.isInteger(err.status) ? err.status : 500;
  const message = err.message || 'Error interno del servidor';

  logger.error({
    status,
    message,
    details: err.details,
    stack: err.stack,
    method: req.method,
    path: req.originalUrl
  }, '❌ Error de API');

  res.status(status).json({
    error: message
  });
}

module.exports = errorHandler;
