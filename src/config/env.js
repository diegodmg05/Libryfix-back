const REQUIRED_VARS = [
  'SUPABASE_URL',
  'SECRET_KEY_SUPABASE',
  'JWT_SECRET'
];

REQUIRED_VARS.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Falta la variable de entorno requerida: ${key}`);
    process.exit(1);
  }
});
