module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    roots: ["<rootDir>"],
    testMatch: ["**/tests/integration/**/*.test.ts"],
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
    },
    setupFilesAfterEnv: ["<rootDir>/src/tests/integration/setup.ts"],
    testTimeout: 30000,
    verbose: true,
    // Don't transform node_modules except for ES modules
    transformIgnorePatterns: ["node_modules/(?!(supertest)/)"],
};
