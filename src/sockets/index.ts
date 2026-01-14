import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import defaultPrisma from "../config/database";
import { SocketController } from "../controllers/socket.controller";
import { PollService } from "../services/poll.service";
import { PrismaClient } from "../generated/prisma/client";

export function setupSocketIO(
    httpServer: HttpServer,
    prisma: PrismaClient = defaultPrisma
): Server {
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL || "http://localhost:3000",
            methods: ["GET", "POST"],
            credentials: true,
        },
    });

    const pollService = new PollService(prisma);
    const socketController = new SocketController(pollService);

    io.on("connection", (socket: Socket) => {
        console.log(`Client connected: ${socket.id}`);

        // Join poll room
        socket.on("join_poll", (pollId: string) => {
            socketController.handleJoinPoll(socket, pollId);
        });

        // Cast vote
        socket.on("cast_vote", (data: unknown) => {
            socketController.handleCastVote(socket, data);
        });

        // Leave poll
        socket.on("leave_poll", (pollId: string) => {
            socketController.handleLeavePoll(socket, pollId);
        });

        // Disconnect
        socket.on("disconnect", () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });

    return io;
}
