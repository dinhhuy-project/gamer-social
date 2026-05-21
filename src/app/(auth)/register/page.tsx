"use client";

import { useState, useEffect } from "react";

import Link from "next/link";

import { toast } from "sonner";

import {
  AtSign,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { AuthLayout } from "@/components/auth/AuthLayout";

import { useAuthActions } from "@/hooks/auth/useAuthActions";

import { registerSchema } from "@/lib/validations/auth.schema";

export default function RegisterPage() {

  const [username, setUsername] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [done, setDone] = useState(false);

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<{
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const { isLoading, error, signUpWithEmail, setError } = useAuthActions();

  // Hiển thị toast khi có lỗi
  useEffect(() => {
    if (error) {
      toast.error(error);
      setError(null); // Reset error sau khi hiển thị
    }
  }, [error, setError]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});

    const result = registerSchema.safeParse({
      email,
      username,
      password,
      confirmPassword,
      display_name: username,
    });

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        const path = err.path[0] as string;
        errors[path] = err.message;
      });
      setFieldErrors(errors);
      return;
    }

    const ok = await signUpWithEmail(email, password, confirmPassword, username);
    if (ok) setDone(true);
  }

  // ── Màn hình xác nhận email ────────────────────────────
  if (done) {
    return (
      <AuthLayout
        title={<><span className="text-[#f46d1b]">Game</span>rHub</>}
        subtitle="Kiểm tra hộp thư của bạn"
        footerText="Đã xác nhận?"
        footerLinkText="Đăng nhập"
        footerLinkTo="/login"
      >
        <div className="text-center space-y-4 py-6">
          <div className="text-5xl">📬</div>
          <p className="text-gray-300 text-sm leading-relaxed">
            Chúng tôi đã gửi link xác nhận đến
          </p>
          <p className="text-[#f46d1b] font-medium">{email}</p>
          <p className="text-gray-500 text-xs">
            Nhấn vào link trong email để kích hoạt tài khoản.
            <br />
            Kiểm tra cả hộp thư Spam nếu không thấy.
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={
        <>
          Join Us 🚀
        </>
      }
      subtitle="Create an account to get started"
      footerText="Already have an account?"
      footerLinkText="Login here"
      footerLinkTo="/login"
    >
      <form
        className="space-y-5"
        onSubmit={handleSubmit}
      >
        <div className="space-y-6">
          {/* Username */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <User className="h-5 w-5" />
            </div>

            <Input
              type="text"
              placeholder="Username"
              required
              value={username}
              onChange={(e) => {
                setUsername(
                  e.target.value
                );
                if (fieldErrors.username) {
                  setFieldErrors({ ...fieldErrors, username: undefined });
                }
              }}
              disabled={isLoading}
              className={`pl-10 bg-[#2b2f3a] border-2 text-gray-200 h-12 rounded-xl focus-visible:ring-1 focus-visible:ring-orange-500 placeholder:text-gray-500 ${fieldErrors.username
                ? "border-red-500"
                : "border-transparent"
                }`}
            />
            {fieldErrors.username && (
              <p className="absolute top-full pt-1 text-xs text-red-400">{fieldErrors.username}</p>
            )}
          </div>

          {/* Email */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <AtSign className="h-5 w-5" />
            </div>

            <Input
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) {
                  setFieldErrors({ ...fieldErrors, email: undefined });
                }
              }}
              disabled={isLoading}
              className={`pl-10 bg-[#2b2f3a] border-2 text-gray-200 h-12 rounded-xl focus-visible:ring-1 focus-visible:ring-orange-500 placeholder:text-gray-500 ${fieldErrors.email
                ? "border-red-500"
                : "border-transparent"
                }`}
            />
            {fieldErrors.email && (
              <p className="absolute top-full pt-1 text-xs text-red-400">{fieldErrors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Lock className="h-5 w-5" />
            </div>

            <Input
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              placeholder="Password"
              required
              value={password}
              onChange={(e) => {
                setPassword(
                  e.target.value
                );
                if (fieldErrors.password) {
                  setFieldErrors({ ...fieldErrors, password: undefined });
                }
              }}
              disabled={isLoading}
              className={`pl-10 pr-10 bg-[#2b2f3a] border-2 text-gray-200 h-12 rounded-xl focus-visible:ring-1 focus-visible:ring-orange-500 placeholder:text-gray-500 ${fieldErrors.password
                ? "border-red-500"
                : "border-transparent"
                }`}
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword(
                  !showPassword
                )
              }
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
            {fieldErrors.password && (
              <p className="absolute top-full pt-1 text-xs text-red-400">{fieldErrors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Lock className="h-5 w-5" />
            </div>

            <Input
              type={
                showConfirmPassword
                  ? "text"
                  : "password"
              }
              placeholder="Confirm Password"
              required
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(
                  e.target.value
                );
                if (fieldErrors.confirmPassword) {
                  setFieldErrors({ ...fieldErrors, confirmPassword: undefined });
                }
              }}
              disabled={isLoading}
              className={`pl-10 pr-10 bg-[#2b2f3a] border-2 text-gray-200 h-12 rounded-xl focus-visible:ring-1 focus-visible:ring-orange-500 placeholder:text-gray-500 ${fieldErrors.confirmPassword
                ? "border-red-500"
                : "border-transparent"
                }`}
            />

            <button
              type="button"
              onClick={() =>
                setShowConfirmPassword(
                  !showConfirmPassword
                )
              }
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
            {fieldErrors.confirmPassword && (
              <p className="absolute top-full pt-1 text-xs text-red-400">{fieldErrors.confirmPassword}</p>
            )}
          </div>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#f46d1b] hover:bg-[#d55e15] text-white font-medium h-12 rounded-xl mt-2 disabled:opacity-50"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account...
            </div>
          ) : (
            "Register"
          )}
        </Button>

        {/* Terms */}
        <p className="text-xs text-center text-gray-500 leading-relaxed">
          By creating an account,
          you agree to our{" "}
          <Link
            href="/terms"
            className="text-orange-400 hover:underline"
          >
            Terms
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="text-orange-400 hover:underline"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </form>
    </AuthLayout>
  );
}