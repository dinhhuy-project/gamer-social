import { z } from "zod";

export const createPostSchema = z.object({
  content: z.string().max(5000).optional(),

  media_urls: z.array(z.string().url()).max(10),

  post_type: z.enum(["regular", "marketplace"]),

  game_name: z.string().optional(),

  listing_price: z.number().positive().optional(),

  tag_ids: z.array(z.number()).max(10),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;