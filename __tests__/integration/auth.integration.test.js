/**
 * Tests de integración para endpoints de autenticación
 * NOTA: Estos tests son más avanzados y requieren app completamente funcional
 * Por ahora, los tests unitarios son más confiables
 */

const request = require('supertest');
const app = require('../../src/app');

// Mock de dependencias externas
jest.mock('../../src/config/supabase');
jest.mock('../../src/services/authService');

const authService = require('../../src/services/authService');

describe('Auth Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('debería registrar un usuario con datos válidos', async () => {
      const newUser = {
        id: '123',
        name: 'John',
        surname: 'Doe',
        email: 'john@example.com',
        rol: 2,
        status: true,
      };

      authService.registerUser.mockResolvedValue(newUser);

      const response = await request(app)
        .post('/auth/register')
        .send({
          name: 'John',
          surname: 'Doe',
          email: 'john@example.com',
          password: 'securePassword123',
        });

      expect(response.status).toBe(201);
      expect(response.body.user?.email).toBe('john@example.com');
    });

    it('debería fallar si el email ya está registrado', async () => {
      const error = new Error('Email already registered');
      error.status = 409;

      authService.registerUser.mockRejectedValue(error);

      const response = await request(app)
        .post('/auth/register')
        .send({
          name: 'John',
          surname: 'Doe',
          email: 'existing@example.com',
          password: 'securePassword123',
        });

      expect(response.status).toBe(409);
    });
  });

  describe('POST /auth/login', () => {
    it('debería hacer login exitosamente con credenciales válidas', async () => {
      const loginResponse = {
        token: 'jwt_token_123',
        user: {
          id: '123',
          name: 'John',
          surname: 'Doe',
          email: 'john@example.com',
          rol: 2,
        },
      };

      authService.loginUser.mockResolvedValue(loginResponse);

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'john@example.com',
          password: 'securePassword123',
        });

      expect(response.status).toBe(200);
      expect(response.body.token).toBe('jwt_token_123');
    });

    it('debería fallar con credenciales inválidas', async () => {
      const error = new Error('Invalid email or password');
      error.status = 401;

      authService.loginUser.mockRejectedValue(error);

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'john@example.com',
          password: 'wrongPassword',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /auth/request-password-reset', () => {
    it('debería procesar solicitud de recuperación de contraseña', async () => {
      authService.requestPasswordReset.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/auth/request-password-reset')
        .send({
          email: 'john@example.com',
        });

      expect(response.status).toBe(200);
    });
  });
});

