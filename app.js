require('dotenv').config();

const express = require('express');
const fs = require('fs');
const path = require('path');
const morgan = require('morgan');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();


// ===============================
// VALIDACIÓN DE VARIABLES .ENV
// ===============================

const {
  URL_SUPABASE,
  SECRET_KEY_SUPABASE,
  PUBLIC_KEY_SUPABASE
} = process.env;

if (!URL_SUPABASE || !SECRET_KEY_SUPABASE) {
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
  origin: 'http://localhost:4200',
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS'],
  credentials: true
}));


// ===============================
// SUPABASE
// ===============================

const supabase = createClient(URL_SUPABASE, SECRET_KEY_SUPABASE);


// Test de conexión al arrancar
(async () => {
  try {
    const { error } = await supabase.from('Users').select('*').limit(1);

    if (error) throw error;

    console.log('✅ Conexión a Supabase OK');
  } catch (err) {
    console.error('❌ Error conectando con Supabase:', err.message);
  }
})();


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
