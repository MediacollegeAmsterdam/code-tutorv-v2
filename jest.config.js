/**
 * Jest Configuration for code-tutor-v2
 *
 * This configuration sets up Jest for testing the code-tutor-v2 extension.
 * TypeScript tests are compiled using ts-jest preset.
 * Coverage thresholds are set to 80% to ensure quality code (educational requirement).
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Coverage configuration - 80% threshold for educational code quality
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Output test coverage in multiple formats for CI and local review (T054)
  coverageReporters: ['text', 'lcov', 'clover', 'json', 'html'],

  // TypeScript compilation settings
  globals: {
    'ts-jest': {
      tsconfig: {
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
      },
    },
  },

  // Global test setup for all test suites (T052)
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],

  // Paths for module resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Ignore patterns
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  transformIgnorePatterns: ['/node_modules/'],

  // Verbose output for CI/CD pipelines
  verbose: true,
};
