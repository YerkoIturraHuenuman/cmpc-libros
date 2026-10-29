import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const config: Config = {
  testEnvironment: 'jsdom',
  coverageProvider: 'v8',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'services/**/*.ts',
    'utils/**/*.ts',
    'hooks/**/*.ts',
    'proxy.ts',
    '!**/*.spec.{ts,tsx}',
    '!**/fixtures.ts',
    '!app/layout.tsx',
    '!app/global-error.tsx',
  ],
  coverageThreshold: {
    global: { statements: 80, branches: 80, functions: 80, lines: 80 },
  },
  coverageDirectory: './coverage',
};

export default createJestConfig(config);
