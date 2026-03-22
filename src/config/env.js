const { logger } = require('./logger');

const REQUIRED_VARS = ['SUPABASE_URL', 'SECRET_KEY_SUPABASE', 'JWT_SECRET'];

REQUIRED_VARS.forEach((key) => {
  if (!process.env[key]) {
    logger.error({ missing: key }, `Falta la variable de entorno requerida: ${key}`);
    process.exit(1);
  }
});

const hasMailjetKey = Boolean(process.env.MAILJET_API_KEY || process.env.SMTP_USER);
const hasMailjetSecret = Boolean(process.env.MAILJET_API_SECRET || process.env.SMTP_PASS);
const hasMailjetFrom = Boolean(process.env.MAILJET_FROM_EMAIL || process.env.SMTP_FROM);

if (!hasMailjetKey) {
  logger.error({ missing: 'MAILJET_API_KEY or SMTP_USER' }, 'Falta la credencial principal para Mailjet');
  process.exit(1);
}

if (!hasMailjetSecret) {
  logger.error({ missing: 'MAILJET_API_SECRET or SMTP_PASS' }, 'Falta la credencial secreta para Mailjet');
  process.exit(1);
}

if (!hasMailjetFrom) {
  logger.error({ missing: 'MAILJET_FROM_EMAIL or SMTP_FROM' }, 'Falta el remitente para Mailjet');
  process.exit(1);
}
