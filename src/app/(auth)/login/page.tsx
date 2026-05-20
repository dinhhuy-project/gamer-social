"use client";

import { useState } from "react";

import Link from "next/link";

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

export default function LoginPage() {

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const { isLoading, error, signInWithEmail } = useAuthActions();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
              onChange={(e) =>
                setEmail(e.target.value)
              }
              disabled={isLoading}
              className="pl-10 bg-[#2b2f3a] border-none text-gray-200 h-12 rounded-xl focus-visible:ring-1 focus-visible:ring-orange-500 placeholder:text-gray-500"
            />
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
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              disabled={isLoading}
              className="pl-10 pr-10 bg-[#2b2f3a] border-none text-gray-200 h-12 rounded-xl focus-visible:ring-1 focus-visible:ring-orange-500 placeholder:text-gray-500"
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
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
            {error}
          </div>
        )}

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