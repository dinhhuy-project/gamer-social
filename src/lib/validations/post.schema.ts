import { z } from "zod";

export const createPostSchema = z.object({
  content: z.string().min(1).max(5000),
  mediaUrls: z.array(z.string().url()).default([]),
  tagIds: z.array(z.number().int().positive()).default([]),
  postType: z.enum(["regular", "marketplace"]).default("regular"),
  listingPrice: z.number().positive().optional(),
  gameName: z.string().min(1).max(100).optional(),
}).refine(
  (d) => d.postType !== "marketplace" || (d.listingPrice !== undefined && d.gameName !== undefined),
  { message: "Bài mua bán phải có giá và tên game", path: ["listingPrice"] }
);

export type CreatePostInput = z.infer<typeof createPostSchema>;
