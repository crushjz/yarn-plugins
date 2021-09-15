module.exports = {
  roots: ['./src'],
  testMatch: ['**/*.spec.(ts|tsx)'],
  transform: {
    '\\.[jt]sx?$': '../../babel-jest.js',
  },
}
