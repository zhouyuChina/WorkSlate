import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: {
          module: "ESNext",
          moduleResolution: "bundler",
          verbatimModuleSyntax: false,
        },
      },
    ],
  },
  transformIgnorePatterns: [
    "node_modules/(?!(@prisma/adapter-better-sqlite3)/)",
  ],
  setupFilesAfterEnv: [],
  testMatch: ["**/*.test.ts"],
};

export default config;
