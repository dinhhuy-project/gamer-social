import { z } from "zod";

export const reactionSchema = z.object({
  type: z.enum(["like", "love", "haha", "wow", "sad", "angry"]),
});

export type ReactionInput = z.infer<typeof reactionSchema>;
