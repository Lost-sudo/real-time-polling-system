import { Request, Response, NextFunction } from "express";
import { PollService } from "../services/poll.service";
import { createPollSchema } from "../types";

export class PollController {
    constructor(private pollService: PollService) {}

    createPoll = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const validatedData = createPollSchema.parse(req.body);
            const poll = await this.pollService.createPoll(validatedData);

            res.status(201).json({
                success: true,
                data: poll,
            });
        } catch (error) {
            next(error);
        }
    };

    getPoll = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { pollId } = req.params;
            const poll = await this.pollService.getPollById(pollId as string);

            if (!poll) {
                res.status(404).json({
                    success: false,
                    error: "Poll not found",
                });
                return;
            }

            const voterIdentifier = this.getVoterIdentifier(req);
            const hasVoted = await this.pollService.hasUserVoted(
                pollId as string,
                voterIdentifier
            );

            res.json({
                success: true,
                data: {
                    ...poll,
                    hasVoted,
                },
            });
        } catch (error) {
            next(error);
        }
    };

    getAllPolls = async (
        _req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const polls = await this.pollService.getAllPolls();

            res.json({
                success: true,
                data: polls,
            });
        } catch (error) {
            next(error);
        }
    };

    closePoll = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { pollId } = req.params;
            await this.pollService.closePoll(pollId as string);

            res.json({
                success: true,
                message: "Poll closed successfully",
            });
        } catch (error) {
            next(error);
        }
    };

    private getVoterIdentifier(req: Request): string {
        return req.cookies?.sessionId || req.ip || "unknown";
    }
}
