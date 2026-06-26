export default {
  testEnvironment: "node",
  transform: {},
  testMatch: ["<rootDir>/tests/**/*.test.js"],
  collectCoverageFrom: ["src/**/*.js", "!src/server.js", "!src/db/init.js"],
  coverageDirectory: "coverage",
  coverageThreshold: {
    global: {
      lines: 60,
      statements: 60,
    },
  },
};
