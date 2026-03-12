const express = require('express');
const pinoHttp = require('pino-http');
const { httpLogger } = require('./config/logger');
const cors = require('cors');
const router = require('./routes');
const { createAppError } = require('./utils/AppError');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// ===============================
// LOGGING
// ===============================

app.use(
  pinoHttp({
    logger: httpLogger,
    customLogLevel(req, res, err) {
      if (err || res.statusCode >= 500) {
        return 'error';
      }

      if (res.statusCode >= 400) {
        return 'warn';
      }

      return 'info';
    },
    customSuccessMessage(req, res) {
      return `${req.method} ${req.originalUrl} completed with ${res.statusCode}`;
    },
    customErrorMessage(req, res, err) {
      return `${req.method} ${req.originalUrl} failed with ${res.statusCode}: ${err.message}`;
    },
    customReceivedMessage(req) {
      return `${req.method} ${req.originalUrl} received`;
    }
  })
);


// ===============================
// MIDDLEWARES
// ===============================

app.use(express.json());

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS'],
  credentials: true
}));

// ===============================
// RUTAS
// ===============================

app.use('/', router);

// ===============================
// 404
// ===============================

app.use((req, res, next) => {
  next(createAppError('Ruta no encontrada', 404));
});

// ===============================
// ERROR HANDLER GLOBAL
// ===============================

app.use(errorHandler);

module.exports = app;
