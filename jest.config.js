module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: [ "/node_modules/", "/test/utils.ts" ],
  testMatch: [ "**/test/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)" ],
  coveragePathIgnorePatterns: [ "/node_modules/", "/test/utils.ts" ]
};

