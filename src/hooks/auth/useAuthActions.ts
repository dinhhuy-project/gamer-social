"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function useAuthActions() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // ── Google OAuth ────────────────────────────────────────
  async function signInWithGoogle() {
    setIsLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      setError("Đăng nhập Google thất bại. Vui lòng thử lại.");
      setIsLoading(false);
    }
    // Nếu thành công: Supabase tự redirect sang Google
    // → Google redirect về /api/auth/callback
    // → callback route redirect về /feed
  }

  // ── Email / Password — Đăng nhập ───────────────────────
  async function signInWithEmail(email: string, password: string) {
    setIsLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "Email hoặc mật khẩu không đúng"
          : "Đăng nhập thất bại. Vui lòng thử lại."
      );
      setIsLoading(false);
      return;
    }

    const profile = await fetch("/api/me", {
      credentials: "same-origin",
    })
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null);

    router.push(profile?.role === "admin" ? "/admin/users" : "/feed");
    router.refresh();
  }

  // ── Email / Password — Đăng ký ─────────────────────────
  async function signUpWithEmail(
    email: string,
    password: string,
    confirmPassword: string,
    username: string
  ) {
    setIsLoading(true);
    setError(null);

    // Validate confirm password
    if (password !== confirmPassword) {
      setError("Passwords do not match.");

      setIsLoading(false);
      return false;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (error) {
      setError(
        (error as any).message?.includes("already registered")
          ? "Email này đã được đăng ký"
          : "Đăng ký thất bại. Vui lòng thử lại."
      );
      setIsLoading(false);
      return false;
    }

    setIsLoading(false);
    return true; // Caller hiển thị thông báo "Kiểm tra email"
  }

  async function signOut() {
    setIsLoading(true);
    setError(null);
    const { error } = await supabase.auth.signOut();
    setIsLoading(false);
    if (error) {
      setError("Đăng xuất thất bại. Vui lòng thử lại.");
      return false;
    }

    router.push("/login");
    router.refresh();
    return true;
  }

  return {
    isLoading,
    error,
    setError,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  };
}
