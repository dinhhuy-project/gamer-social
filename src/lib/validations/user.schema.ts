import { z } from "zod";

export const updateProfileSchema = z.object({
  display_name: z.string().max(100).optional(),

  bio: z.string().max(300).optional(),

  avatar_url: z.string().url().optional(),

  cover_url: z.string().url().optional(),
});