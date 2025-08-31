module.exports = {
  projects: [
    {
      displayName: 'API Tests',
      testMatch: ['<rootDir>/apps/api/src/**/*.spec.ts'],
      testEnvironment: 'node',
      transform: {
        '^.+\\.(t|j)s$': ['ts-jest', {
          tsconfig: '<rootDir>/apps/api/tsconfig.app.json',
        }],
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/apps/api/src/$1',
        '^@utils/(.*)$': '<rootDir>/packages/utils/$1',
      },
      collectCoverageFrom: [
        '<rootDir>/apps/api/src/**/*.(t|j)s',
      ],
      coverageDirectory: '<rootDir>/coverage/apps/api',
      testPathIgnorePatterns: ['/node_modules/', '/dist/'],
      transformIgnorePatterns: ['/node_modules/'],
      moduleFileExtensions: ['ts', 'js', 'json'],
    },
    {
      displayName: 'Utils Tests',
      testMatch: ['<rootDir>/packages/utils/**/*.spec.ts'],
      testEnvironment: 'node',
      transform: {
        '^.+\\.(t|j)s$': ['ts-jest', {
          tsconfig: '<rootDir>/packages/utils/tsconfig.json',
        }],
      },
      collectCoverageFrom: [
        '<rootDir>/packages/utils/**/*.(t|j)s',
      ],
      coverageDirectory: '<rootDir>/coverage/packages/utils',
      testPathIgnorePatterns: ['/node_modules/', '/dist/'],
      transformIgnorePatterns: ['/node_modules/'],
      moduleFileExtensions: ['ts', 'js', 'json'],
    },
  ],
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/coverage/**',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  testEnvironment: 'node',
  verbose: true,
};
