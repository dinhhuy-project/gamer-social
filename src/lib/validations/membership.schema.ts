import { z } from "zod";

export const createMembershipCheckoutSchema = z.object({
  returnUrl: z.string().url(),
});

export const confirmMembershipPaymentSchema = z.object({
  paymentRef: z.string().min(1),
});
