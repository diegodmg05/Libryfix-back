const express = require('express');
const fs = require('fs');
const path = require('path');
const morgan = require('morgan');
const cors = require('cors');
const router = require('./routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// ===============================
// LOGGING
// ===============================

const logStream = fs.createWriteStream(
  path.join(__dirname, '..', 'access.log'),
  { flags: 'a' }
);
app.use(morgan('combined', { stream: logStream }));

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

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// ===============================
// ERROR HANDLER GLOBAL
// ===============================

app.use(errorHandler);

module.exports = app;
