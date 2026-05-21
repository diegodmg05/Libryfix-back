/**
 * Tests unitarios para authService.js
 * Cobertura: registro, login, validaciones, manejo de errores
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authService = require('../authService');
const { createAppError } = require('../../utils/AppError');
const { createSupabaseMock } = require('./mocks');

// Mock dependencies
jest.mock('../emailService', () => ({
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('../../config/supabase');
jest.mock('../../config/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const supabase = require('../../config/supabase');

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    supabase.from = jest.fn();
  });

  describe('registerUser', () => {
    const testData = {
      name: 'John',
      surname: 'Doe',
      email: 'john@example.com',
      password: 'securePassword123',
    };

    it('debería registrar un usuario exitosamente', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      const mockInsertBuilder = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: [
            {
              id: '123',
              name: testData.name,
              surname: testData.surname,
              email: testData.email,
              password: 'hashed_password',
              rol: 2,
              status: true,
              created_at: new Date().toISOString(),
            },
          ],
          error: null,
        }),
      };

      supabase.from
        .mockReturnValueOnce(mockQueryBuilder)
        .mockReturnValueOnce(mockInsertBuilder);

      bcrypt.hash.mockResolvedValue('hashed_password');

      const result = await authService.registerUser(testData);

      expect(result.id).toBe('123');
      expect(result.email).toBe(testData.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(testData.password, 10);
    });

    it('debería fallar si el email ya está registrado', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { email: testData.email },
          error: null,
        }),
      };

      supabase.from.mockReturnValue(mockQueryBuilder);

      await expect(authService.registerUser(testData)).rejects.toThrow(
        'Email already registered'
      );
    });

    it('debería manejar errores de base de datos durante la búsqueda', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      };

      supabase.from.mockReturnValue(mockQueryBuilder);

      await expect(authService.registerUser(testData)).rejects.toThrow(
        'No se pudo verificar el email del usuario'
      );
    });
  });

  describe('loginUser', () => {
    const testData = {
      email: 'john@example.com',
      password: 'securePassword123',
    };

    it('debería hacer login exitosamente con credenciales válidas', async () => {
      const userData = {
        id: '123',
        name: 'John',
        surname: 'Doe',
        email: testData.email,
        password: 'hashed_password',
        rol: 2,
        status: true,
        created_at: new Date().toISOString(),
      };

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: userData,
          error: null,
        }),
      };

      supabase.from.mockReturnValue(mockQueryBuilder);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('test_token_123');

      const result = await authService.loginUser(testData);

      expect(result.token).toBe('test_token_123');
      expect(result.user.email).toBe(testData.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        testData.password,
        userData.password
      );
    });

    it('debería fallar si el usuario no existe', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'No rows found' },
        }),
      };

      supabase.from.mockReturnValue(mockQueryBuilder);

      await expect(authService.loginUser(testData)).rejects.toThrow(
        'Invalid email or password'
      );
    });

    it('debería fallar si la contraseña es incorrecta', async () => {
      const userData = {
        id: '123',
        name: 'John',
        surname: 'Doe',
        email: testData.email,
        password: 'hashed_password',
        rol: 2,
        status: true,
        created_at: new Date().toISOString(),
      };

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: userData,
          error: null,
        }),
      };

      supabase.from.mockReturnValue(mockQueryBuilder);
      bcrypt.compare.mockResolvedValue(false);

      await expect(authService.loginUser(testData)).rejects.toThrow(
        'Invalid email or password'
      );
    });
  });

  describe('verifyOtp', () => {
    it('debería retornar true si el OTP es válido', async () => {
      const email = 'john@example.com';
      const token = '123456';
      const validOtpRow = {
        id: '1',
        otp: token,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      };

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: validOtpRow,
          error: null,
        }),
      };

      supabase.from.mockReturnValue(mockQueryBuilder);

      const result = await authService.verifyOtp(email, token);

      expect(result).toBe(true);
    });

    it('debería retornar false si el OTP es inválido', async () => {
      const email = 'john@example.com';
      const token = '123456';
      const invalidOtpRow = {
        id: '1',
        otp: '654321',
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      };

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: invalidOtpRow,
          error: null,
        }),
      };

      supabase.from.mockReturnValue(mockQueryBuilder);

      const result = await authService.verifyOtp(email, token);

      expect(result).toBe(false);
    });

    it('debería retornar false si no hay OTP válido', async () => {
      const email = 'john@example.com';
      const token = '123456';

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      supabase.from.mockReturnValue(mockQueryBuilder);

      const result = await authService.verifyOtp(email, token);

      expect(result).toBe(false);
    });
  });
});
