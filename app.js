require('dotenv').config();

const express = require('express');
const fs = require('fs');
const path = require('path');
const morgan = require('morgan');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const userRoutes = require('./routes/userRoutes');

// ===============================
// VALIDACIÓN DE VARIABLES .ENV
// ===============================

const {
  SUPABASE_URL,
  SECRET_KEY_SUPABASE,
  PUBLIC_KEY_SUPABASE
} = process.env;

if (!SUPABASE_URL || !SECRET_KEY_SUPABASE) {
  console.error("❌ Faltan variables de entorno de Supabase en .env");
  process.exit(1);
}


// ===============================
// LOGGING
// ===============================

const logStream = fs.createWriteStream(
  path.join(__dirname, 'access.log'),
  { flags: 'a' }
);

app.use(morgan('combined', { stream: logStream }));


// ===============================
// MIDDLEWARES
// ===============================

app.use(express.json());

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS'],
  credentials: true
}));

app.use('/users', userRoutes);


// ===============================
// SUPABASE
// ===============================

// ===============================
// RUTAS
// ===============================

app.get('/', (req, res) => {
  res.send('API funcionando 🚀');
});

app.use((req, res) => {
  res.status(404).send('Ruta no encontrada');
});


// ===============================
// SERVER
// ===============================

const PORT = 3000;

app.listen(PORT, () =>
  console.log(`Servidor en http://localhost:${PORT}`)
);
