"use client";

import { useState, useEffect } from "react";

import Link from "next/link";

import { toast } from "sonner";

import {
  AtSign,
  Eye,
  EyeOff,
  Lock,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { AuthLayout } from "@/components/auth/AuthLayout";

import { useAuthActions } from "@/hooks/auth/useAuthActions";

import { loginSchema } from "@/lib/validations/auth.schema";

export default function LoginPage() {

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const { isLoading, error, signInWithEmail, setError } = useAuthActions();

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

    const result = loginSchema.safeParse({
      email,
      password,
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

    await signInWithEmail(email, password);
  }

  return (
    <AuthLayout
      title={
        <>
          Welcome{" "}
          <span
            role="img"
            aria-label="wave"
          >
            👋
          </span>
        </>
      }
      subtitle="Please enter your email and password"
      footerText="Don't have an account?"
      footerLinkText="Register now!"
      footerLinkTo="/register"
    >
      <form
        className="space-y-5"
        onSubmit={handleSubmit}
      >
        <div className="space-y-4">
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
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#f46d1b] hover:bg-[#d55e15] text-white font-medium h-12 rounded-xl disabled:opacity-50"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Logging in...
            </div>
          ) : (
            "Login"
          )}
        </Button>

        {/* Forgot Password */}
        <div className="text-center">
          <Link
            href="/forgot-password"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Forgot password?
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}