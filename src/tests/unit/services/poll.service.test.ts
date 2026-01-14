import { PollService } from "../../../services/poll.service";
import { prismaMock, resetPrismaMock } from "../mocks/prisma.mock";

describe("PollService", () => {
    let pollService: PollService;

    beforeEach(() => {
        resetPrismaMock();
        pollService = new PollService(prismaMock);
    });

    describe("createPoll", () => {
        it("should create a poll with multiple options", async () => {
            const inputData = {
                question: "What is your favorite color?",
                description: "A simple poll about colors",
                options: ["Red", "Green", "Blue"],
            };

            const mockPollResult = {
                id: "poll-123",
                question: "What is your favorite color?",
                description: "A simple poll about colors",
                createdBy: null,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                options: [
                    { id: "opt-1", text: "Red", voteCount: 0 },
                    { id: "opt-2", text: "Green", voteCount: 0 },
                    { id: "opt-3", text: "Blue", voteCount: 0 },
                ],
            };

            prismaMock.poll.create.mockResolvedValue(mockPollResult);

            const result = await pollService.createPoll(inputData);

            expect(prismaMock.poll.create).toHaveBeenCalledTimes(1);
            expect(prismaMock.poll.create).toHaveBeenCalledWith({
                data: {
                    question: inputData.question,
                    description: inputData.description,
                    createdBy: undefined,
                    options: {
                        create: [
                            { text: "Red" },
                            { text: "Green" },
                            { text: "Blue" },
                        ],
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

            expect(result).toEqual(mockPollResult);
            expect(result.options).toHaveLength(3);
            expect(result.options[0].voteCount).toBe(0);
            expect(result.options[1].voteCount).toBe(0);
            expect(result.options[2].voteCount).toBe(0);
        });

        it("should handle optional description field", async () => {
            const inputData = {
                question: "Quick poll?",
                options: ["Yes", "No"],
            };

            const mockResult = {
                id: "poll-456",
                question: "Quick poll?",
                description: null,
                createdBy: null,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                options: [
                    { id: "opt-1", text: "Yes", voteCount: 0 },
                    { id: "opt-2", text: "No", voteCount: 0 },
                ],
            };

            prismaMock.poll.create.mockResolvedValue(mockResult);

            const result = await pollService.createPoll(inputData);

            expect(result.description).toBeNull();
            expect(result.options).toHaveLength(2);
        });

        it("should propagate createdBy field when provided", async () => {
            const inputData = {
                question: "Team poll?",
                options: ["Option 1", "Option 2"],
                createdBy: "user-789",
            };

            const mockResult = {
                id: "poll-789",
                question: "Team poll?",
                description: null,
                createdBy: "user-789",
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                options: [
                    { id: "opt-1", text: "Option 1", voteCount: 0 },
                    { id: "opt-2", text: "Option 2", voteCount: 0 },
                ],
            };

            prismaMock.poll.create.mockResolvedValue(mockResult);

            const result = await pollService.createPoll(inputData);

            expect(prismaMock.poll.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        createdBy: "user-789",
                    }),
                })
            );
            expect(result.createdBy).toBe("user-789");
        });
    });

    describe("getPollById", () => {
        it("should return a poll when it exists", async () => {
            const pollId = "poll-abc";
            const mockPoll = {
                id: pollId,
                question: "Test poll?",
                description: null,
                createdBy: null,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                options: [
                    { id: "opt-1", text: "Option A", voteCount: 5 },
                    { id: "opt-2", text: "Option B", voteCount: 3 },
                ],
            };

            prismaMock.poll.findUnique.mockResolvedValue(mockPoll);
            const result = await pollService.getPollById(pollId);

            expect(prismaMock.poll.findUnique).toHaveBeenCalledWith({
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
            expect(result).toEqual(mockPoll);
        });

        it("should return null when poll does not exist", async () => {
            const pollId = "non-existent";

            prismaMock.poll.findUnique.mockResolvedValue(null);

            const result = await pollService.getPollById(pollId);

            expect(result).toBeNull();
        });
    });

    describe("getAllPolls", () => {
        it("should return all active polls", async () => {
            const mockPolls = [
                {
                    id: "poll-1",
                    question: "Test poll 1?",
                    description: null,
                    createdBy: null,
                    isActive: true,
                    createdAt: new Date("2024-01-01T00:00:00.000Z"),
                    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
                    options: [
                        { id: "opt-1", text: "Option A", voteCount: 5 },
                        { id: "opt-2", text: "Option B", voteCount: 3 },
                    ],
                },
                {
                    id: "poll-2",
                    question: "Test poll 2?",
                    description: null,
                    createdBy: null,
                    isActive: true,
                    createdAt: new Date("2024-01-02T00:00:00.000Z"),
                    updatedAt: new Date("2024-01-02T00:00:00.000Z"),
                    options: [
                        { id: "opt-1", text: "Option A", voteCount: 5 },
                        { id: "opt-2", text: "Option B", voteCount: 3 },
                    ],
                },
            ];

            prismaMock.poll.findMany.mockResolvedValue(mockPolls);
            const result = await pollService.getAllPolls();

            expect(prismaMock.poll.findMany).toHaveBeenCalledWith({
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
            expect(result).toEqual(mockPolls);
            expect(result[0].id).toBe("poll-1");
            expect(result[1].id).toBe("poll-2");
        });

        it("should return empty array when no polls exist", async () => {
            prismaMock.poll.findMany.mockResolvedValue([]);
            const result = await pollService.getAllPolls();

            expect(prismaMock.poll.findMany).toHaveBeenCalledWith({
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
            expect(result).toEqual([]);
            expect(result).toHaveLength(0);
        });
    });

    describe("castVote", () => {
        it("should successfully cast a new vote", async () => {
            const voteData = {
                pollId: "poll-123",
                optionId: "opt-1",
            };

            const voterIdentifier = "voter-abc";

            prismaMock.vote.findUnique.mockResolvedValue(null);

            prismaMock.$transaction.mockResolvedValue([
                { id: "vote-1" },
                1,
            ] as any);

            const mockUpdatedOptions = [
                {
                    id: "opt-1",
                    text: "Option A",
                    voteCount: 6,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    pollId: "poll-123",
                },
                {
                    id: "opt-2",
                    text: "Option B",
                    voteCount: 3,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    pollId: "poll-123",
                },
            ];

            prismaMock.option.findMany.mockResolvedValue(mockUpdatedOptions);

            const result = await pollService.castVote(
                voteData,
                voterIdentifier
            );

            expect(prismaMock.vote.findUnique).toHaveBeenCalledWith({
                where: {
                    pollId_voterIdentifier: {
                        pollId: "poll-123",
                        voterIdentifier: "voter-abc",
                    },
                },
            });
            expect(result.success).toBe(true);
            expect(result.pollId).toBe(voteData.pollId);
            expect(result.optionId).toBe(voteData.optionId);
            expect(result.updatedOptions).toEqual(mockUpdatedOptions);
            expect(result.alreadyVoted).toBeUndefined();
        });

        it("should reject duplicate vote from same user", async () => {
            const voteData = {
                pollId: "poll-123",
                optionId: "opt-2",
            };

            const voterIdentifier = "voter-xyz";

            const existingVote = {
                id: "vote-999",
                pollId: "poll-123",
                optionId: "opt-2",
                voterIdentifier: "voter-xyz",
                createdAt: new Date(),
            };

            prismaMock.vote.findUnique.mockResolvedValue(existingVote);

            const mockOptions = [
                {
                    id: "opt-1",
                    text: "Option A",
                    voteCount: 5,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    pollId: "poll-123",
                },
                {
                    id: "opt-2",
                    text: "Option B",
                    voteCount: 3,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    pollId: "poll-123",
                },
            ];

            prismaMock.option.findMany.mockResolvedValue(mockOptions);

            const result = await pollService.castVote(
                voteData,
                voterIdentifier
            );

            expect(prismaMock.$transaction).not.toHaveBeenCalled();
            expect(result.success).toBe(false);
            expect(result.alreadyVoted).toBe(true);
            expect(result.updatedOptions).toEqual(mockOptions);
        });

        it("should call transaction with correct parameters", async () => {
            const voteData = {
                pollId: "poll-456",
                optionId: "opt-5",
            };

            const voterIdentifier = "voter-test";

            prismaMock.vote.findUnique.mockResolvedValue(null);
            prismaMock.$transaction.mockResolvedValue([{}, 1] as any);
            prismaMock.option.findMany.mockResolvedValue([]);

            await pollService.castVote(voteData, voterIdentifier);

            expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
            const transactionArg = (prismaMock.$transaction as any).mock
                .calls[0][0];
            expect(Array.isArray(transactionArg)).toBe(true);
            expect(transactionArg).toHaveLength(2);
        });
    });

    describe("hasUserVoted", () => {
        it("should return true when user has voted", async () => {
            const pollId = "poll-123";
            const voterIdentifier = "voter-abc";

            const mockVote = {
                id: "vote-1",
                pollId,
                optionId: "opt-1",
                voterIdentifier,
                createdAt: new Date(),
            };

            prismaMock.vote.findUnique.mockResolvedValue(mockVote);

            const result = await pollService.hasUserVoted(
                pollId,
                voterIdentifier
            );

            expect(result).toBe(true);
            expect(prismaMock.vote.findUnique).toHaveBeenCalledWith({
                where: {
                    pollId_voterIdentifier: {
                        pollId,
                        voterIdentifier,
                    },
                },
            });
        });

        it("should return false when user has not voted", async () => {
            const pollId = "poll-456";
            const voterIdentifier = "voter-xyz";

            prismaMock.vote.findUnique.mockResolvedValue(null);

            const result = await pollService.hasUserVoted(
                pollId,
                voterIdentifier
            );

            expect(result).toBe(false);
            expect(prismaMock.vote.findUnique).toHaveBeenCalledWith({
                where: {
                    pollId_voterIdentifier: {
                        pollId,
                        voterIdentifier,
                    },
                },
            });
        });
    });

    describe("closePoll", () => {
        it("should set poll isActive to false", async () => {
            const pollId = "poll-789";

            const mockUpdatedPoll = {
                id: pollId,
                question: "Closed poll",
                description: null,
                createdBy: null,
                isActive: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            prismaMock.poll.update.mockResolvedValue(mockUpdatedPoll);

            await pollService.closePoll(pollId);

            expect(prismaMock.poll.update).toHaveBeenCalledWith({
                where: { id: pollId },
                data: { isActive: false },
            });
        });
    });
});
