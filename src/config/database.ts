import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const nodeEnv = process.env.NODE_ENV;
const isTest = nodeEnv === "test";

// Use a dedicated test database when NODE_ENV=test, otherwise fall back to the main database
const connectionString = isTest
    ? process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL
    : process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error(
        isTest
            ? "TEST_DATABASE_URL or DATABASE_URL must be set when running tests."
            : "DATABASE_URL must be set for the application to run."
    );
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export default prisma;
