/**
 * Mocks para Supabase
 * Utilizados en tests para simular respuestas de la base de datos
 */

const createSupabaseMock = () => {
  return {
    from: jest.fn((table) => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
    })),
    auth: {
      getUser: jest.fn(),
      signOut: jest.fn(),
    },
  };
};

module.exports = {
  createSupabaseMock,
};
