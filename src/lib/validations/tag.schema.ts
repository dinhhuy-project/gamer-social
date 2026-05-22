import { z } from "zod";

export const createTagSchema = z.object({
  name: z.string().min(1).max(100),
});

export type CreateTagInput = z.infer<typeof createTagSchema>;

export const updateTagSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

export type UpdateTagInput = z.infer<typeof updateTagSchema>;
