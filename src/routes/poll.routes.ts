import { Router } from "express";
import { PollController } from "../controllers/poll.controller";
import { PollService } from "../services/poll.service";
import { PrismaClient } from "../generated/prisma/client";

export function createPollRoutes(prisma: PrismaClient): Router {
    const router = Router();
    const pollService = new PollService(prisma);
    const pollController = new PollController(pollService);

    router.post("/polls", pollController.createPoll);
    router.get("/polls", pollController.getAllPolls);
    router.get("/polls/:pollId", pollController.getPoll);
    router.patch("/polls/:pollId/close", pollController.closePoll);

    return router;
}
