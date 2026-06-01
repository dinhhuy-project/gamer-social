import { z } from "zod";

export const createConversationSchema = z.object({
  participant_ids: z.array(z.string().uuid()).min(2),
  tx_post_id: z.string().uuid().optional(),
  tx_buyer_id: z.string().uuid().optional(),
  tx_seller_id: z.string().uuid().optional(),
});

export const findConversationSchema = z.object({
  other_user_id: z.string().uuid(),
});
