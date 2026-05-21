// src/lib/validations/user.schema.ts

import { z } from "zod";

import { CONFIG } from "@/lib/constants/config";

/* =========================================================
   COMMON
========================================================= */

export const usernameSchema = z
  .string()
  .min(
    CONFIG.USERNAME_MIN_LENGTH,
    `Username tối thiểu ${CONFIG.USERNAME_MIN_LENGTH} ký tự`
  )
  .max(
    CONFIG.USERNAME_MAX_LENGTH,
    `Username tối đa ${CONFIG.USERNAME_MAX_LENGTH} ký tự`
  )
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "Chỉ được chứa chữ, số và dấu _"
  );

export const passwordSchema = z
  .string()
  .min(8, "Mật khẩu tối thiểu 8 ký tự")
  .max(100, "Mật khẩu quá dài")
  .regex(
    /[A-Z]/,
    "Phải có ít nhất 1 chữ hoa"
  )
  .regex(
    /[a-z]/,
    "Phải có ít nhất 1 chữ thường"
  )
  .regex(
    /[0-9]/,
    "Phải có ít nhất 1 chữ số"
  );

/* =========================================================
   REGISTER
========================================================= */

export const registerSchema = z
  .object({
    email: z
      .string()
      .email("Email không hợp lệ"),

    username: usernameSchema,

    display_name: z
      .string()
      .min(2, "Tên hiển thị tối thiểu 2 ký tự")
      .max(100, "Tên hiển thị quá dài"),

    password: passwordSchema,

    confirmPassword: z.string(),
  })
  .refine(
    (data) =>
      data.password ===
      data.confirmPassword,
    {
      message:
        "Mật khẩu xác nhận không khớp",
      path: ["confirmPassword"],
    }
  );

/* =========================================================
   LOGIN
========================================================= */

export const loginSchema = z.object({
  email: z
    .string()
    .email("Email không hợp lệ"),

  password: z
    .string()
    .min(1, "Vui lòng nhập mật khẩu"),
});

/* =========================================================
   CHANGE PASSWORD
========================================================= */

export const changePasswordSchema =
  z
    .object({
      currentPassword: z
        .string()
        .min(
          1,
          "Vui lòng nhập mật khẩu hiện tại"
        ),

      newPassword: passwordSchema,

      confirmPassword: z.string(),
    })
    .refine(
      (data) =>
        data.newPassword ===
        data.confirmPassword,
      {
        message:
          "Mật khẩu xác nhận không khớp",
        path: ["confirmPassword"],
      }
    );

/* =========================================================
   TYPES
========================================================= */

export type RegisterInput =
  z.infer<typeof registerSchema>;

export type LoginInput =
  z.infer<typeof loginSchema>;

export type ChangePasswordInput =
  z.infer<
    typeof changePasswordSchema
  >;