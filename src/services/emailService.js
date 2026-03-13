const { transporter, nodemailer } = require('../config/nodemailer');
const { logger } = require('../config/logger');

const FROM_EMAIL = process.env.SMTP_FROM ||
  (process.env.SMTP_USER ? `Libryfix <${process.env.SMTP_USER}>` : 'Libryfix <noreply@libryfix.com>');

async function sendPasswordResetEmail(to, otp) {
  try {
    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to,
      subject: 'Código para recuperar tu contraseña - Libryfix',
      text: `Tu código de verificación es: ${otp}. Válido durante 15 minutos.`,
      html: `
      <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">
        <h1>Recuperar contraseña</h1>
        <p>Tu código de verificación es:</p>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${otp}</p>
        <p>Es válido durante 15 minutos. No lo compartas con nadie.</p>
        <p>Si no has solicitado este correo, puedes ignorarlo.</p>
      </div>
    `
    });

    if (process.env.SMTP_HOST === 'smtp.ethereal.email' && nodemailer.getTestMessageUrl) {
      logger.info({ previewUrl: nodemailer.getTestMessageUrl(info) }, 'Vista previa correo');
    }

    return info;
  } catch (err) {
    logger.error({ to, error: err }, 'Error enviando correo de recuperación');
    const safeError = new Error('No se pudo enviar el correo de recuperación de contraseña.', { cause: err });
    throw safeError;
  }
}

module.exports = { sendPasswordResetEmail };
