require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const nodemailer = require('nodemailer');
const { logger } = require('./logger');

const smtpConfig = {
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER && process.env.SMTP_PASS
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    : undefined,
  tls: {
    rejectUnauthorized: false
  }
};

const transporter = nodemailer.createTransport(smtpConfig);

function getSmtpConfigSummary() {
  return {
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    hasAuth: Boolean(smtpConfig.auth),
    smtpUser: process.env.SMTP_USER || null,
    smtpFrom: process.env.SMTP_FROM || null
  };
}

if (smtpConfig.host !== 'smtp.ethereal.email' && !smtpConfig.auth) {
  logger.warn(getSmtpConfigSummary(), 'SMTP configurado sin credenciales. El envio de correos puede fallar en produccion');
}

module.exports = { transporter, nodemailer, getSmtpConfigSummary };
