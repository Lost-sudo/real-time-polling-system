import { PollService } from "../../services/poll.service";
import prisma from "../../config/database";
import {
    setupTestDatabase,
    cleanupTestDatabase,
    teardownTestDatabase,
} from "./setup";

describe("Voting Integration Tests", () => {
    let pollService: PollService;
    let testPollId: string;
    let testOptionsId: string[];

    beforeAll(async () => {
        await setupTestDatabase();
        pollService = new PollService(prisma);
    });

    afterAll(async () => {
        await teardownTestDatabase();
    });

    beforeEach(async () => {
        await cleanupTestDatabase();

        const poll = await pollService.createPoll({
            question: "Test Poll for voting?",
            options: ["Option A", "Option B", "Option C"],
            createdBy: "test-user",
        });

        testPollId = poll.id;
        testOptionsId = poll.options.map((option) => option.id);
    });

    describe("Single Vote Flow", () => {
        it("should successfully cast a vote", async () => {
            const result = await pollService.castVote(
                {
                    pollId: testPollId,
                    optionId: testOptionsId[0],
                },
                "test-voter"
            );

            expect(result.success).toBe(true);
            expect(result.pollId).toBe(testPollId);
            expect(result.optionId).toBe(testOptionsId[0]);

            // Check vote count increase
            const updatedOption = result.updatedOptions.find(
                (option) => option.id === testOptionsId[0]
            );
            expect(updatedOption).toBeTruthy();
            expect(updatedOption?.voteCount).toBe(1);

            // Verify in database
            const voteInDb = await prisma.vote.findUnique({
                where: {
                    pollId_voterIdentifier: {
                        pollId: testPollId,
                        voterIdentifier: "test-voter",
                    },
                },
            });
            expect(voteInDb).toBeTruthy();
        });

        it("should prevent duplicate votes from same user", async () => {
            await pollService.castVote(
                {
                    pollId: testPollId,
                    optionId: testOptionsId[1],
                },
                "test-voter"
            );

            const result = await pollService.castVote(
                {
                    pollId: testPollId,
                    optionId: testOptionsId[1],
                },
                "test-voter"
            );

            expect(result.success).toBe(false);
            expect(result.alreadyVoted).toBe(true);

            const votes = await prisma.vote.findMany({
                where: { voterIdentifier: "test-voter" },
            });
            expect(votes).toHaveLength(1);
        });

        it("should tract hasUserVoted correctly", async () => {
            const voterIdentifier = "voter-123";

            const hasVotedBefore = await pollService.hasUserVoted(
                testPollId,
                voterIdentifier
            );
            expect(hasVotedBefore).toBe(false);

            await pollService.castVote(
                {
                    pollId: testPollId,
                    optionId: testOptionsId[1],
                },
                voterIdentifier
            );

            const hasVotedAfter = await pollService.hasUserVoted(
                testPollId,
                voterIdentifier
            );
            expect(hasVotedAfter).toBe(true);
        });
    });
});
