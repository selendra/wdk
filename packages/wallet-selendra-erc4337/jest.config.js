export default {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  transform: {},
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js'
  ]
}
