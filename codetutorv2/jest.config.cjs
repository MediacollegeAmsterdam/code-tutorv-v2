module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }]
  },
  modulePathIgnorePatterns: ['<rootDir>/out/'],
  testPathIgnorePatterns: ['<rootDir>/out/'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.ts'],
  testMatch: ['**/src/test/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node']
};
