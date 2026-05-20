import { z } from "zod";

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(2000).optional(),
  mediaUrls: z.array(z.string().url()).default([]),
}).refine(
  (d) => d.content || d.mediaUrls.length > 0,
  { message: "Phải có nội dung hoặc ảnh" }
);

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
