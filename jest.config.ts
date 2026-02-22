import type { Config } from 'jest'
import nextJest from 'next/jest.js'


const createJestConfig = nextJest({
    // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
    dir: './',
})

// Add any custom config to be passed to Jest
const config: Config = {
    coverageProvider: 'v8',
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '^jose$': require.resolve('jose'),
        '^node-fetch$': '<rootDir>/__tests__/mocks/emptyMock.ts',
        '^@postiz/node$': '<rootDir>/__tests__/mocks/emptyMock.ts',
        '^@immich/sdk$': '<rootDir>/__tests__/mocks/emptyMock.ts',
    },
    testMatch: [
        '**/__tests__/**/*.test.[jt]s?(x)',
        '**/?(*.)+(spec|test).[jt]s?(x)'
    ],
    transformIgnorePatterns: [
        '/node_modules/(?!jose|node-fetch|@postiz/node|@immich/sdk|minipass|minipass-fetch|minizlib|fs-minipass|tar|yallist/)',
    ],
    collectCoverageFrom: [
        'app/**/*.{js,jsx,ts,tsx}',
        'components/**/*.{js,jsx,ts,tsx}',
        'lib/**/*.{js,jsx,ts,tsx}',
        'hooks/**/*.{js,jsx,ts,tsx}',
        '!**/*.d.ts',
        '!**/node_modules/**',
        '!**/.next/**',
    ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config)
