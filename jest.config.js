/** @type {import('jest').Config} */
const config = {
  testEnvironment: "node",
  transform: {
    "^.+\\.jsx?$": ["babel-jest", { configFile: "./babel.test.config.js" }],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testMatch: ["**/__tests__/**/*.test.js"],
  collectCoverageFrom: [
    "lib/**/*.js",
    "app/api/**/*.js",
    "!**/node_modules/**",
  ],
};

module.exports = config;
