const { logger } = require('../config/logger');

const MAILJET_API_URL = 'https://api.mailjet.com/v3.1/send';
const MAILJET_API_KEY = process.env.MAILJET_API_KEY || process.env.SMTP_USER;
const MAILJET_API_SECRET = process.env.MAILJET_API_SECRET || process.env.SMTP_PASS;
const FROM_EMAIL = process.env.MAILJET_FROM_EMAIL || process.env.SMTP_FROM || 'noreply@libryfix.com';
const FROM_NAME = process.env.MAILJET_FROM_NAME || 'Libryfix';

function getMailjetConfigSummary() {
  return {
    apiUrl: MAILJET_API_URL,
    hasApiKey: Boolean(MAILJET_API_KEY),
    hasApiSecret: Boolean(MAILJET_API_SECRET),
    fromEmail: FROM_EMAIL,
    fromName: FROM_NAME
  };
}

function getEmailProviderHint(status, responseText) {
  const message = `${responseText || ''}`.toLowerCase();

  if (status === 401 || status === 403 || message.includes('unauthorized')) {
    return 'Mailjet ha rechazado las credenciales API. Revisa MAILJET_API_KEY y MAILJET_API_SECRET.';
  }

  if (message.includes('sender') || message.includes('from') || message.includes('not valid')) {
    return 'Mailjet ha rechazado el remitente. Verifica que MAILJET_FROM_EMAIL o SMTP_FROM este autorizado en Mailjet.';
  }

  if (status >= 500) {
    return 'Mailjet ha respondido con un error del servidor.';
  }

  return 'No se pudo determinar la causa exacta del fallo con la informacion disponible.';
}

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
    if (!MAILJET_API_KEY || !MAILJET_API_SECRET || !FROM_EMAIL) {
      logger.error(getMailjetConfigSummary(), 'Configuracion Mailjet incompleta para enviar correos de recuperacion');
      throw new Error('Configuracion Mailjet incompleta');
    }

    const payload = {
      Messages: [
        {
          From: {
            Email: FROM_EMAIL,
            Name: FROM_NAME
          },
          To: [
            {
              Email: to
            }
          ],
          Subject: 'Codigo para recuperar tu contrasena - Libryfix',
          TextPart: `Tu codigo de verificacion es: ${otp}. Valido durante 15 minutos.`,
          HTMLPart: `
          <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">
            <h1>Recuperar contrasena</h1>
            <p>Tu codigo de verificacion es:</p>
            <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${otp}</p>
            <p>Es valido durante 15 minutos. No lo compartas con nadie.</p>
            <p>Si no has solicitado este correo, puedes ignorarlo.</p>
          </div>
        `
        }
      ]
    };

    const auth = Buffer.from(`${MAILJET_API_KEY}:${MAILJET_API_SECRET}`).toString('base64');

    const response = await fetch(MAILJET_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();

    if (!response.ok) {
      logger.error({
        to,
        mailjet: getMailjetConfigSummary(),
        status: response.status,
        responseText,
        providerHint: getEmailProviderHint(response.status, responseText)
      }, 'Error enviando correo de recuperacion mediante Mailjet API');

      throw new Error(`Mailjet API error: ${response.status}`);
    }

    logger.info({
      to,
      status: response.status
    }, 'Correo de recuperacion enviado mediante Mailjet API');

    return {
      status: response.status,
      body: responseText
    };
  } catch (err) {
    logger.error({
      to,
      mailjet: getMailjetConfigSummary(),
      errorMessage: err.message,
      errorCause: err.cause?.message
    }, 'Error enviando correo de recuperacion');

    const safeError = new Error('No se pudo enviar el correo de recuperacion de contrasena.', { cause: err });
    throw safeError;
  }
}

module.exports = { sendPasswordResetEmail };
