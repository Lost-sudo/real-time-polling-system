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

        it("should reject poll with question too short", async () => {
            const response = await supertest(app)
                .post("/api/polls")
                .send({
                    question: "Hi?",
                    options: ["Yes", "No"],
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe("Validation error");
        });

        it("should reject poll with more than 10 options", async () => {
            const response = await supertest(app)
                .post("/api/polls")
                .send({
                    question: "To many options?",
                    options: Array(11).fill("Option"),
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe("Validation error");
        });
    });

    describe("GET /api/polls/:polId", () => {
        it("should retrieve an existing poll", async () => {
            // Create poll first
            const createResponse = await supertest(app)
                .post("/api/polls")
                .send({
                    question: "What is your favorite programming language?",
                    description: "A simple poll about programming preferences",
                    options: ["TypeScript", "Python", "Go", "Rust"],
                })
                .expect(201);

            const pollId = createResponse.body.data.id;

            const getResponse = await supertest(app)
                .get(`/api/polls/${pollId}`)
                .expect(200);

            expect(getResponse.body.success).toBe(true);
            expect(getResponse.body.data.id).toBe(pollId);
            expect(getResponse.body.data.question).toBe(
                "What is your favorite programming language?"
            );
            expect(getResponse.body.data.description).toBe(
                "A simple poll about programming preferences"
            );
            expect(getResponse.body.data.options).toHaveLength(4);
            expect(getResponse.body.data.hasVoted).toBe(false);
        });

        it("should return 404 for non-exitent poll", async () => {
            const fakeId = "00000000-0000-0000-0000-000000000000";
            const response = await supertest(app)
                .get(`/api/polls/${fakeId}`)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe("Poll not found");
        });
    });

    describe("GET /api/polls", () => {
        it("should return all active polls", async () => {
            // Create multiple polls
            await supertest(app)
                .post("/api/polls")
                .send({
                    question: "Poll 1?",
                    options: ["A", "B", "C", "D"],
                })
                .expect(201);

            await supertest(app)
                .post("/api/polls")
                .send({
                    question: "Poll 2?",
                    options: ["A", "B", "C", "D"],
                })
                .expect(201);

            await supertest(app)
                .post("/api/polls")
                .send({
                    question: "Poll 3?",
                    options: ["A", "B", "C", "D"],
                })
                .expect(201);

            const response = await supertest(app).get("/api/polls").expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(3);
        });

        it("should return closed polls", async () => {
            // Create poll
            const createResponse = await supertest(app)
                .post("/api/polls")
                .send({
                    question: "Active poll?",
                    options: ["Yes", "No"],
                });

            const pollId = createResponse.body.data.id;

            // Close poll
            await supertest(app)
                .patch(`/api/polls/${pollId}/close`)
                .expect(200);

            const response = await supertest(app).get("/api/polls").expect(200);

            expect(response.body.data).toHaveLength(0);
        });
    });

    describe("PATCH /api/polls/:pollId/close - Close Poll", () => {
        it("should close an active poll", async () => {
            // Create poll
            const createResponse = await supertest(app)
                .post("/api/polls")
                .send({
                    question: "To be closed?",
                    options: ["Yes", "No"],
                })
                .expect(201);

            const pollId = createResponse.body.data.id;

            // Close poll
            const response = await supertest(app)
                .patch(`/api/polls/${pollId}/close`)
                .expect(200);

            expect(response.body.success).toBe(true);

            const pollInDb = await prisma.poll.findUnique({
                where: { id: pollId },
            });
            expect(pollInDb?.isActive).toBe(false);
        });
    });
});
