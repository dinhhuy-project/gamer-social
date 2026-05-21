import { z } from "zod";

export const sendMessageSchema = z.object({
  conversation_id: z.string().uuid(),

  content: z.string().max(5000).optional(),

  media_urls: z.array(z.string().url()).optional(),
});