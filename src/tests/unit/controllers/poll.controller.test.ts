import { Request, Response } from "express";
import { PollController } from "../../../controllers/poll.controller";
import { PollService } from "../../../services/poll.service";

describe("PollController", () => {
    let pollController: PollController;
    let mockPollService: jest.Mocked<PollService>;
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;

    beforeEach(() => {
        mockPollService = {
            createPoll: jest.fn(),
            getPollById: jest.fn(),
            getAllPolls: jest.fn(),
            getOptionsByPollId: jest.fn(),
            castVote: jest.fn(),
            hasUserVoted: jest.fn(),
            closePoll: jest.fn(),
        } as any;
        pollController = new PollController(mockPollService);

        mockRequest = {
            body: {},
            params: {},
            ip: "127.0.0.1",
            cookies: {},
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
    });

    describe("createPoll", () => {
        it("should create poll and return 201 status", async () => {
            const requestBody = {
                question: "Test question?",
                options: ["A", "B", "C"],
            };

            const mockCreatedPoll = {
                id: "poll-123",
                question: "Test question?",
                description: null,
                createdBy: "127.0.0.1",
                isActive: true,
                createdAt: new Date(),
                options: [
                    {
                        id: "option-123",
                        text: "A",
                        voteCount: 0,
                    },
                    {
                        id: "option-124",
                        text: "B",
                        voteCount: 0,
                    },
                    {
                        id: "option-125",
                        text: "C",
                        voteCount: 0,
                    },
                ],
            };

            mockRequest.body = requestBody;
            mockPollService.createPoll.mockResolvedValue(mockCreatedPoll);

            await pollController.createPoll(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockPollService.createPoll).toHaveBeenCalledWith(
                requestBody
            );
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: mockCreatedPoll,
            });
        });
    });

    describe("getPoll", () => {
        it("should return poll with hasVoted flag", async () => {
            const pollId = "poll-abc";

            mockRequest.params = { pollId };
            mockRequest.cookies = { sessionId: "session-123" };

            const mockPoll = {
                id: pollId,
                question: "Test question?",
                description: null,
                createdBy: "127.0.0.1",
                isActive: true,
                createdAt: new Date(),
                options: [
                    {
                        id: "option-123",
                        text: "A",
                        voteCount: 0,
                    },
                    {
                        id: "option-124",
                        text: "B",
                        voteCount: 0,
                    },
                    {
                        id: "option-125",
                        text: "C",
                        voteCount: 0,
                    },
                ],
            };

            mockPollService.getPollById.mockResolvedValue(mockPoll);
            mockPollService.hasUserVoted.mockResolvedValue(true);

            await pollController.getPoll(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockPollService.getPollById).toHaveBeenCalledWith(pollId);
            expect(mockPollService.hasUserVoted).toHaveBeenCalledWith(
                pollId,
                "session-123"
            );
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    ...mockPoll,
                    hasVoted: true,
                },
            });
        });

        it("should return 404 when poll not found", async () => {
            mockRequest.params = { pollId: "non-existent" };
            mockPollService.getPollById.mockResolvedValue(null);

            await pollController.getPoll(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockPollService.getPollById).toHaveBeenCalledWith(
                "non-existent"
            );
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: "Poll not found",
            });
        });

        it("should use IP address when no session cookie", async () => {
            mockRequest = {
                params: { pollId: "poll-123" },
                cookies: {},
                ip: "192.168.1.1",
            };

            const mockPoll = {
                id: "poll-123",
                question: "Test question?",
                description: null,
                createdBy: "127.0.0.1",
                isActive: true,
                createdAt: new Date(),
                options: [
                    {
                        id: "option-123",
                        text: "A",
                        voteCount: 0,
                    },
                    {
                        id: "option-124",
                        text: "B",
                        voteCount: 0,
                    },
                    {
                        id: "option-125",
                        text: "C",
                        voteCount: 0,
                    },
                ],
            };

            mockPollService.getPollById.mockResolvedValue(mockPoll);
            mockPollService.hasUserVoted.mockResolvedValue(false);

            await pollController.getPoll(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockPollService.getPollById).toHaveBeenCalledWith(
                "poll-123"
            );
            expect(mockPollService.hasUserVoted).toHaveBeenCalledWith(
                "poll-123",
                "192.168.1.1"
            );
        });
    });

    describe("getAllPolls", () => {
        it("should return all polls", async () => {
            const mockPolls = [
                {
                    id: "poll-123",
                    question: "Test question?",
                    description: null,
                    createdBy: "127.0.0.1",
                    isActive: true,
                    createdAt: new Date(),
                    options: [
                        {
                            id: "option-123",
                            text: "A",
                            voteCount: 0,
                        },
                        {
                            id: "option-124",
                            text: "B",
                            voteCount: 0,
                        },
                        {
                            id: "option-125",
                            text: "C",
                            voteCount: 0,
                        },
                    ],
                },
                {
                    id: "poll-124",
                    question: "Test question 2?",
                    description: null,
                    createdBy: "127.0.0.1",
                    isActive: true,
                    createdAt: new Date(),
                    options: [
                        {
                            id: "option-126",
                            text: "A",
                            voteCount: 0,
                        },
                        {
                            id: "option-127",
                            text: "B",
                            voteCount: 0,
                        },
                        {
                            id: "option-128",
                            text: "C",
                            voteCount: 0,
                        },
                    ],
                },
            ];

            mockPollService.getAllPolls.mockResolvedValue(mockPolls);

            await pollController.getAllPolls(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockPollService.getAllPolls).toHaveBeenCalledTimes(1);
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: mockPolls,
            });
        });
    });

    describe("closePoll", () => {
        it("should close poll and return success message", async () => {
            mockRequest.params = { pollId: "poll-123" };
            mockPollService.closePoll.mockResolvedValue(undefined);

            await pollController.closePoll(
                mockRequest as Request,
                mockResponse as Response
            );

            expect(mockPollService.closePoll).toHaveBeenCalledWith("poll-123");
            expect(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                message: "Poll closed successfully",
            });
        });
    });
});
