module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: [
    '<rootDir>/test/setup.ts'
  ],
  globals: {
    'ts-jest': {
      tsConfig: 'tsconfig.json',
    },
  },
};
