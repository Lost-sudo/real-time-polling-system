import "dotenv/config";
import { execSync } from "child_process";

// Ensure we are in test mode and using the test database URL
process.env.NODE_ENV = "test";
process.env.PRISMA_SKIP_DOTENV = "1";

if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}

export async function setupTestDatabase() {
    // Run Prisma migrations and generate the client for the test database
    try {
        execSync("npx prisma migrate deploy", { stdio: "inherit" });
        execSync("npx prisma generate", { stdio: "inherit" });
    } catch (error) {
        // Rethrow to fail the test run early if database setup fails
        throw error;
    }
}

import prisma from "../../config/database";

export async function cleanupTestDatabase() {
    // Clean all tables in reverse order (respecting foreign keys)
    await prisma.vote.deleteMany();
    await prisma.option.deleteMany();
    await prisma.poll.deleteMany();
}

export async function teardownTestDatabase() {
    await cleanupTestDatabase();
    await prisma.$disconnect();
}
