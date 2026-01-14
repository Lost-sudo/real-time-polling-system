import { createServer } from "http";
import { createApp } from "./app";
import { setupSocketIO } from "./sockets";
import dotenv from "dotenv";
import prisma from "./config/database";

dotenv.config();

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        // Test database connection
        await prisma.$connect();
        console.log("✓ Database connected");

        // Create Express app
        const app = createApp(prisma);

        // Create HTTP server
        const httpServer = createServer(app);

        // Setup Socket.IO
        const io = setupSocketIO(httpServer, prisma);
        console.log("✓ Socket.IO configured");

        // Start server
        httpServer.listen(PORT, () => {
            console.log(`✓ Server running on port ${PORT}`);
            console.log(`  HTTP: http://localhost:${PORT}`);
            console.log(`  WebSocket: ws://localhost:${PORT}`);
        });

        // Graceful shutdown
        const shutdown = async () => {
            console.log("\nShutting down gracefully...");
            io.close();
            await prisma.$disconnect();
            process.exit(0);
        };

        process.on("SIGTERM", shutdown);
        process.on("SIGINT", shutdown);
    } catch (error) {
        console.error("Failed to start server:", error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

startServer();
