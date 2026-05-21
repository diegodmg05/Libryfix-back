/**
 * Tests unitarios para validadores
 * Cobertura: patrones regex, validaciones básicas
 */

const { EMAIL_REGEX } = require('../../utils/validators');

describe('Validators', () => {
  describe('EMAIL_REGEX', () => {
    it('debería validar emails válidos', () => {
      const validEmails = [
        'user@example.com',
        'test.user@example.co.uk',
        'user+tag@example.com',
        'user123@test-domain.com',
      ];

      validEmails.forEach((email) => {
        expect(EMAIL_REGEX.test(email)).toBe(true);
      });
    });

    it('debería rechazar emails inválidos', () => {
      const invalidEmails = [
        'invalid.email',
        '@example.com',
        'user@',
        'user@.com',
        'user @example.com',
      ];

      invalidEmails.forEach((email) => {
        expect(EMAIL_REGEX.test(email)).toBe(false);
      });
    });
  });
});
