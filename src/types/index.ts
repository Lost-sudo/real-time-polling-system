import z from "zod";

export const createPollSchema = z.object({
  question: z.string().min(5).max(500),
  description: z.string().min(0).max(2000).optional(),
  createdBy: z.string().optional(),
  options: z.array(z.string().min(1).max(200)).min(2).max(10),
});

export const castVoteSchema = z.object({
  pollId: z.string().uuid(),
  optionId: z.string().uuid(),
});

export type CreatePollInput = z.infer<typeof createPollSchema>;
export type CastVoteInput = z.infer<typeof castVoteSchema>;

export interface PollWithOptions {
  id: string;
  question: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  options: OptionWithVotes[];
}

export interface OptionWithVotes {
  id: string;
  text: string;
  voteCount: number;
}

export interface VoteResult {
  success: boolean;
  pollId: string;
  optionId: string;
  updatedOptions: OptionWithVotes[];
  alreadyVoted?: boolean;
}
