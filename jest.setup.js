// Setup file para Jest
// Aquí puedes configurar variables de entorno para testing

process.env.SUPABASE_URL = 'https://test-supabase.supabase.co';
process.env.SECRET_KEY_SUPABASE = 'test-key';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
process.env.MAILJET_API_KEY = 'test-mailjet-key';
process.env.MAILJET_API_SECRET = 'test-mailjet-secret';
process.env.MAILJET_FROM_EMAIL = 'test@example.com';
process.env.NODE_ENV = 'test';

// Mock de pino-http para evitar errores de logger
jest.mock('pino-http', () => {
  return jest.fn(() => (req, res, next) => {
    res.locals = res.locals || {};
    next();
  });
});

// Mock de pino
jest.mock('pino', () => {
  const createLogger = jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn(function() {
      return this;
    }),
  }));

  createLogger.transport = jest.fn(() => ({
    target: 'pino-pretty',
  }));

  return createLogger;
});


