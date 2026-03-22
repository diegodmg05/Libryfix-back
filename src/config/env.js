const REQUIRED_VARS = [
  'SUPABASE_URL',
  'SECRET_KEY_SUPABASE',
  'JWT_SECRET',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_FROM'
];

const { logger } = require('./logger');

REQUIRED_VARS.forEach((key) => {
  if (!process.env[key]) {
    logger.error({ missing: key }, `❌ Falta la variable de entorno requerida: ${key}`);
    process.exit(1);
  }
});
