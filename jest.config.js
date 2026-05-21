module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/config/env.js', // Excluye validación de entorno
    '!src/**/*.test.js',
    '!src/**/*.spec.js',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
  ],
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/__tests__/**/*.spec.js',
    '**/?(*.)+(spec|test).js',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/mocks.js',
  ],
  verbose: true,
  testTimeout: 10000,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
