import { Socket } from "socket.io";
import { PollService } from "../services/poll.service";
import { castVoteSchema } from "../types";
import z from "zod";

export class SocketController {
    constructor(private readonly pollService: PollService) {}

    handleJoinPoll = async (socket: Socket, pollId: string): Promise<void> => {
        try {
            // Validate poll exists
            const poll = await this.pollService.getPollById(pollId);

            if (!poll) {
                socket.emit("error", { message: "Poll not found" });
                return;
            }

            await socket.join(`poll:${pollId}`);

            const voterIdentifier = this.getVoterIdentifier(socket);
            const hasVoted = await this.pollService.hasUserVoted(
                pollId,
                voterIdentifier
            );

            socket.emit("poll_joined", {
                poll,
                hasVoted,
            });

            console.log(`Socket ${socket.id} joined poll:${pollId}`);
        } catch (error) {
            console.error("Error in handleJoinPoll:", error);
            socket.emit("error", {
                message: "Failed to join poll",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            });
        }
    };

    handleCastVote = async (socket: Socket, data: unknown): Promise<void> => {
        try {
            // Validate input
            const validatedData = castVoteSchema.parse(data);
            const voterIdentifier = this.getVoterIdentifier(socket);

            const result = await this.pollService.castVote(
                validatedData,
                voterIdentifier
            );

            if (!result.success) {
                socket.emit("vote_error", {
                    message: result.alreadyVoted
                        ? "You have already voted"
                        : "Failed to cast vote",
                });
                return;
            }

            // Broadcast updated results to all users in the poll room
            socket.to(`poll:${result.pollId}`).emit("poll_updated", {
                pollId: result.pollId,
                options: result.updatedOptions,
            });

            socket.emit("vote_success", {
                pollId: result.pollId,
                optionsId: result.optionId,
                options: result.updatedOptions,
            });

            console.log(
                `Vote cast: Poll ${result.pollId}, Option ${result.optionId}`
            );
        } catch (error) {
            console.error("Error in handleCastVote:", error);

            if (error instanceof z.ZodError) {
                socket.emit("vote_error", {
                    message: "Invalid vote data",
                    details: error.issues,
                });
            } else {
                socket.emit("vote_error", {
                    message: "Failed to cast vote",
                    details:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                });
            }
        }
    };

    handleLeavePoll = (socket: Socket, pollId: string): void => {
        socket.leave(`poll:${pollId}`);
        console.log(`Socket ${socket.id} left poll:${pollId}`);
    };

    private getVoterIdentifier(socket: Socket): string {
        return (
            socket.handshake.auth.sessionId ||
            (socket.handshake.auth.headers["x-forwarded-for"] as string) ||
            socket.handshake.address ||
            socket.id
        );
    }
}
