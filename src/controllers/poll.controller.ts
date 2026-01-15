import { Request, Response } from "express";
import { PollService } from "../services/poll.service";
import { createPollSchema } from "../types";

export class PollController {
    constructor(private pollService: PollService) {}

    createPoll = async (req: Request, res: Response): Promise<void> => {
        const validatedData = createPollSchema.parse(req.body);
        const poll = await this.pollService.createPoll(validatedData);

        res.status(201).json({
            success: true,
            data: poll,
        });
    };

    getPoll = async (req: Request, res: Response): Promise<void> => {
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
    };

    getAllPolls = async (_req: Request, res: Response): Promise<void> => {
        const polls = await this.pollService.getAllPolls();

        res.json({
            success: true,
            data: polls,
        });
    };

    closePoll = async (req: Request, res: Response): Promise<void> => {
        const { pollId } = req.params;
        await this.pollService.closePoll(pollId as string);

        res.json({
            success: true,
            message: "Poll closed successfully",
        });
    };

    private getVoterIdentifier(req: Request): string {
        return req.cookies?.sessionId || req.ip || "unknown";
    }
}
