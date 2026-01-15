import express, { Application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createPollRoutes } from "./routes/poll.routes";
import { PrismaClient } from "./generated/prisma/client";
import { errorHandler } from "./middleware/error.middleware";

export function createApp(prisma: PrismaClient): Application {
    const app = express();

    // Middleware
    app.use(
        cors({
            origin: process.env.CLIENT_URL || "http://localhost:3000",
            credentials: true,
        })
    );
    app.use(express.json());
    app.use(cookieParser());

    // Trust proxy for accurate IP addresses
    app.set("trust proxy", true);

    // Routes
    app.use("/api", createPollRoutes(prisma));

    // Health check
    app.get("/health", (_req, res) => {
        res.json({ status: "ok", timestamp: new Date().toISOString() });
    });

    // Error handler
    app.use(errorHandler);

    return app;
}
