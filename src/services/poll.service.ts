import defaultPrisma from "../config/database";
import { PrismaClient } from "../generated/prisma/client";
import {
    CastVoteInput,
    CreatePollInput,
    PollWithOptions,
    VoteResult,
} from "../types";

export class PollService {
    constructor(private readonly prisma: PrismaClient = defaultPrisma) {
        this.prisma = prisma;
    }

    async createPoll(data: CreatePollInput): Promise<PollWithOptions> {
        const poll = await this.prisma.poll.create({
            data: {
                question: data.question,
                description: data.description,
                createdBy: data.createdBy,
                options: {
                    create: data.options.map((option) => ({ text: option })),
                },
            },
            include: {
                options: {
                    select: {
                        id: true,
                        text: true,
                        voteCount: true,
                    },
                },
            },
        });

        return poll;
    }

    async getPollById(pollId: string): Promise<PollWithOptions | null> {
        const poll = await this.prisma.poll.findUnique({
            where: { id: pollId },
            include: {
                options: {
                    select: {
                        id: true,
                        text: true,
                        voteCount: true,
                    },
                },
            },
        });
        return poll;
    }

    async getAllPolls(): Promise<PollWithOptions[]> {
        const polls = await this.prisma.poll.findMany({
            where: { isActive: true },
            include: {
                options: {
                    select: {
                        id: true,
                        text: true,
                        voteCount: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        return polls;
    }

    async castVote(
        data: CastVoteInput,
        voterIdentifier: string
    ): Promise<VoteResult> {
        if (await this.hasUserVoted(data.pollId, voterIdentifier)) {
            const options = await this.getOptionsByPollId(data.pollId);
            return {
                success: false,
                pollId: data.pollId,
                optionId: data.optionId,
                updatedOptions: options,
                alreadyVoted: true,
            };
        }

        await this.prisma.$transaction([
            this.prisma.vote.create({
                data: {
                    pollId: data.pollId,
                    optionId: data.optionId,
                    voterIdentifier,
                },
            }),

            this.prisma
                .$executeRaw`UPDATE options SET "voteCount" = "voteCount" + 1 WHERE id::uuid = ${data.optionId}::uuid`,
        ]);

        const updatedOptions = await this.getOptionsByPollId(data.pollId);

        return {
            success: true,
            pollId: data.pollId,
            optionId: data.optionId,
            updatedOptions,
        };
    }

    async hasUserVoted(
        pollId: string,
        voterIdentifier: string
    ): Promise<boolean> {
        const vote = await this.prisma.vote.findUnique({
            where: {
                pollId_voterIdentifier: {
                    pollId,
                    voterIdentifier,
                },
            },
        });

        return !!vote;
    }

    private async getOptionsByPollId(pollId: string) {
        return this.prisma.option.findMany({
            where: { pollId },
            select: {
                id: true,
                text: true,
                voteCount: true,
            },
        });
    }

    async closePoll(pollId: string): Promise<void> {
        await this.prisma.poll.update({
            where: { id: pollId },
            data: { isActive: false },
        });
    }
}
