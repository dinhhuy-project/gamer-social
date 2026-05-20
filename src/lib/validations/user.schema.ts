import { z } from "zod";
import { CONFIG } from "@/lib/constants/config";

export const registerSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự")
    .regex(/[A-Z]/, "Phải có ít nhất 1 chữ hoa")
    .regex(/[0-9]/, "Phải có ít nhất 1 chữ số"),
  username: z.string()
    .min(CONFIG.USERNAME_MIN_LENGTH, `Username tối thiểu ${CONFIG.USERNAME_MIN_LENGTH} ký tự`)
    .max(CONFIG.USERNAME_MAX_LENGTH, `Username tối đa ${CONFIG.USERNAME_MAX_LENGTH} ký tự`)
    .regex(/^[a-zA-Z0-9_]+$/, "Chỉ được chứa chữ, số và _"),
});

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  bio: z.string().max(CONFIG.BIO_MAX_LENGTH).optional(),
  avatarUrl: z.string().url().optional(),
  coverUrl: z.string().url().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
