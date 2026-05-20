import Link from "next/link";

import { AuthCard } from "@/components/auth/AuthCard";

import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to continue"
    >
      <LoginForm />

      <p className="mt-6 text-center text-sm text-zinc-400">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="text-white hover:underline"
        >
          Register
        </Link>
      </p>
    </AuthCard>
  );
}