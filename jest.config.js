const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Proveer la ruta del directorio Next.js
  dir: './',
})

// Configuración custom de Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}

module.exports = createJestConfig(customJestConfig)
