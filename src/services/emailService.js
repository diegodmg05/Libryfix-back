const { transporter, nodemailer, getSmtpConfigSummary } = require('../config/nodemailer');
const { logger } = require('../config/logger');

const FROM_EMAIL = process.env.SMTP_FROM ||
  (process.env.SMTP_USER ? `Libryfix <${process.env.SMTP_USER}>` : 'Libryfix <noreply@libryfix.com>');

function getEmailProviderHint(error) {
  const message = `${error?.message || ''} ${error?.response || ''}`.toLowerCase();

  if (message.includes('sender') || message.includes('from') || message.includes('address rejected')) {
    return 'El proveedor SMTP ha rechazado el remitente. Revisa SMTP_FROM y verifica que ese email o dominio este autorizado en Mailjet.';
  }

  if (message.includes('auth') || message.includes('invalid login') || message.includes('authentication')) {
    return 'Las credenciales SMTP parecen invalidas o no estan cargadas en produccion.';
  }

  if (message.includes('connect') || message.includes('timeout') || message.includes('greeting')) {
    return 'No se pudo establecer conexion con el servidor SMTP desde produccion.';
  }

  return 'No se pudo determinar la causa exacta del fallo SMTP con la informacion disponible.';
}

async function sendPasswordResetEmail(to, otp) {
  try {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      logger.error(getSmtpConfigSummary(), 'Configuracion SMTP incompleta para enviar correos de recuperacion');
      throw new Error('Configuracion SMTP incompleta');
    }

    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to,
      subject: 'Codigo para recuperar tu contrasena - Libryfix',
      text: `Tu codigo de verificacion es: ${otp}. Valido durante 15 minutos.`,
      html: `
      <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">
        <h1>Recuperar contrasena</h1>
        <p>Tu codigo de verificacion es:</p>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${otp}</p>
        <p>Es valido durante 15 minutos. No lo compartas con nadie.</p>
        <p>Si no has solicitado este correo, puedes ignorarlo.</p>
      </div>
    `
    });

    if (process.env.SMTP_HOST === 'smtp.ethereal.email' && nodemailer.getTestMessageUrl) {
      logger.info({ previewUrl: nodemailer.getTestMessageUrl(info) }, 'Vista previa correo');
    }

    return info;
  } catch (err) {
    logger.error({
      to,
      smtp: getSmtpConfigSummary(),
      errorMessage: err.message,
      errorCode: err.code,
      errorCommand: err.command,
      errorResponse: err.response,
      providerHint: getEmailProviderHint(err)
    }, 'Error enviando correo de recuperacion');

    const safeError = new Error('No se pudo enviar el correo de recuperacion de contrasena.', { cause: err });
    throw safeError;
  }
}

module.exports = { sendPasswordResetEmail };
