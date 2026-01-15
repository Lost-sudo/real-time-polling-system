import supertest from "supertest";
import { Application } from "express";
import { createApp } from "../../app";
import prisma from "../../config/database";
import {
    setupTestDatabase,
    cleanupTestDatabase,
    teardownTestDatabase,
} from "./setup";

describe("Poll API Integration Tests", () => {
    let app: Application;
    beforeAll(async () => {
        await setupTestDatabase();
        app = createApp(prisma);
    });

    afterAll(async () => {
        await teardownTestDatabase();
    });

    beforeEach(async () => {
        await cleanupTestDatabase();
    });

    describe("POST /api/polls - Create Poll", () => {
        it("should create a new poll with options", async () => {
            const response = await supertest(app)
                .post("/api/polls")
                .send({
                    question: "What is your favorite programming language?",
                    description: "A simple poll about programming preferences",
                    options: ["TypeScript", "Python", "Go", "Rust"],
                })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toMatchObject({
                question: "What is your favorite programming language?",
                description: "A simple poll about programming preferences",
                isActive: true,
            });

            expect(response.body.data.options).toHaveLength(4);
            expect(response.body.data.options[0]).toHaveProperty("id");
            expect(response.body.data.options[0]).toHaveProperty("text");
            expect(response.body.data.options[0].voteCount).toBe(0);

            const pollInDb = await prisma.poll.findUnique({
                where: { id: response.body.data.id },
                include: { options: true },
            });
            expect(pollInDb).toBeTruthy();
            expect(pollInDb?.options).toHaveLength(4);
        });

        it("should reject poll with less than 2 options", async () => {
            const response = await supertest(app)
                .post("/api/polls")
                .send({
                    question: "Invalid poll?",
                    options: ["Only one option"],
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe("Validation error");
        });
    });
});
