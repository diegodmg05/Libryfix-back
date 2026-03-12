/**
 * Manejador global de errores de Express.
 * Captura cualquier error no controlado lanzado con next(err).
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error('❌ Error no controlado:', err.message || err);

  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor'
  });
}

module.exports = errorHandler;
