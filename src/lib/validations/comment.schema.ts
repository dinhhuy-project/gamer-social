import { z } from "zod";

export const createCommentSchema = z.object({
  post_id: z.string().uuid(),

  parent_id: z.string().uuid().optional(),

  content: z
    .string()
    .min(1, "Nội dung không được để trống")
    .max(1000),
});