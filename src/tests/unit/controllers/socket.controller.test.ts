import { Socket } from "socket.io";
import { SocketController } from "../../../controllers/socket.controller";
import { PollService } from "../../../services/poll.service";

describe("SocketController", () => {
    let socketController: SocketController;
    let mockPollService: jest.Mocked<PollService>;
    let mockSocket: Partial<Socket>;

    beforeEach(() => {
        mockPollService = {
            getPollById: jest.fn(),
            castVote: jest.fn(),
            hasUserVoted: jest.fn(),
        } as any;

        socketController = new SocketController(mockPollService);

        mockSocket = {
            id: "socket-123",
            join: jest.fn(),
            leave: jest.fn(),
            emit: jest.fn(),
            to: jest.fn().mockReturnThis(),
            handshake: {
                auth: {
                    sessionId: "session-123",
                },
                headers: {},
                address: "127.0.0.1",
            } as any,
        } as any;
    });

    describe("handleJoinPoll", () => {
        it("should join poll room and emit poll data", async () => {
            const pollId = "poll-123";
            const mockPoll = {
                id: pollId,
                question: "Socket test poll?",
                description: null,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: "127.0.0.1",
                options: [
                    {
                        id: "option-123",
                        text: "Option 1",
                        voteCount: 0,
                    },
                    {
                        id: "option-456",
                        text: "Option 2",
                        voteCount: 0,
                    },
                ],
            };

            mockPollService.getPollById.mockResolvedValue(mockPoll);
            mockPollService.hasUserVoted.mockResolvedValue(false);

            await socketController.handleJoinPoll(mockSocket as Socket, pollId);

            expect(mockSocket.join).toHaveBeenCalledWith(`poll:${pollId}`);

            expect(mockSocket.emit).toHaveBeenCalledWith("poll_joined", {
                poll: mockPoll,
                hasVoted: false,
            });

            expect(mockPollService.getPollById).toHaveBeenCalledWith(pollId);
            expect(mockPollService.hasUserVoted).toHaveBeenCalledWith(
                pollId,
                "session-123"
            );
        });

        it("should emit error when poll not found", async () => {
            const pollId = "non-existent";
            mockPollService.getPollById.mockResolvedValue(null);

            await socketController.handleJoinPoll(mockSocket as Socket, pollId);

            expect(mockSocket.join).not.toHaveBeenCalled();
            expect(mockSocket.emit).toHaveBeenCalledWith("error", {
                message: "Poll not found",
            });
        });

        it("should handle hasVoted status correctly", async () => {
            const pollId = "poll-789";
            const mockPoll = {
                id: pollId,
                question: "Already voted?",
                description: null,
                createdBy: "127.0.0.1",
                isActive: true,
                createdAt: new Date(),
                options: [],
            };

            mockPollService.getPollById.mockResolvedValue(mockPoll);
            mockPollService.hasUserVoted.mockResolvedValue(true);

            await socketController.handleJoinPoll(mockSocket as Socket, pollId);

            expect(mockSocket.emit).toHaveBeenCalledWith("poll_joined", {
                poll: mockPoll,
                hasVoted: true,
            });
        });
    });

    describe("handleCastVote", () => {
        it("should cast vote and broadcast to room", async () => {
            const voteData = {
                pollId: "poll-123",
                optionId: "opt-1",
            };

            const mockVoteResult = {
                success: true,
                pollId: "poll-123",
                optionId: "opt-1",
                updatedOptions: [
                    { id: "opt-1", text: "Option A", voteCount: 11 },
                    { id: "opt-2", text: "Option B", voteCount: 22 },
                ],
            };

            mockPollService.castVote.mockResolvedValue(mockVoteResult);

            await socketController.handleCastVote(
                mockSocket as Socket,
                voteData
            );

            expect(mockPollService.castVote).toHaveBeenCalledWith(
                voteData,
                "session-123"
            );
            expect(mockSocket.to).toHaveBeenCalledWith("poll:poll-123");
            expect(mockSocket.emit).toHaveBeenCalledWith("poll_updated", {
                pollId: "poll-123",
                options: mockVoteResult.updatedOptions,
            });
            expect(mockSocket.emit).toHaveBeenCalledWith("vote_success", {
                pollId: "poll-123",
                optionId: "opt-1",
                options: mockVoteResult.updatedOptions,
            });
        });

        it("should emit error for duplicate vote", async () => {
            const voteData = {
                pollId: "poll-456",
                optionId: "opt-2",
            };

            const mockVoteResult = {
                success: false,
                pollId: "poll-456",
                optionId: "opt-2",
                updatedOptions: [],
                alreadyVoted: true,
            };

            mockPollService.castVote.mockResolvedValue(mockVoteResult);

            await socketController.handleCastVote(
                mockSocket as Socket,
                voteData
            );

            expect(mockSocket.emit).toHaveBeenCalledWith("vote_error", {
                message: "You have already voted in this poll",
            });

            expect(mockSocket.to).not.toHaveBeenCalled();
        });

        it("should handle validation errors", async () => {
            const invalidData = {
                pollId: "poll-123",
                // Missing optionId - this will trigger validation error
            };

            await socketController.handleCastVote(
                mockSocket as Socket,
                invalidData
            );

            expect(mockSocket.emit).toHaveBeenCalledWith(
                "vote_error",
                expect.objectContaining({
                    message: "Invalid vote data",
                })
            );

            expect(mockPollService.castVote).not.toHaveBeenCalled();
        });

        it("should use correct voter identifier from socket", async () => {
            const voteData = {
                pollId: "poll-999",
                optionId: "opt-3",
            };

            Object.assign(mockSocket.handshake!, {
                auth: {},
                headers: {
                    "x-forwarded-for": "127.0.0.1",
                },
                address: "127.0.0.1",
            });

            mockPollService.castVote.mockResolvedValue({
                success: true,
                pollId: "poll-999",
                optionId: "opt-3",
                updatedOptions: [],
            });

            await socketController.handleCastVote(
                mockSocket as Socket,
                voteData
            );

            expect(mockPollService.castVote).toHaveBeenCalledWith(
                voteData,
                "127.0.0.1"
            );
        });
    });
});
