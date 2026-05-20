import Link from "next/link";

import { AuthCard } from "@/components/auth/AuthCard";

import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <AuthCard
      title="Create account"
      description="Join Gamer Social"
    >
      <RegisterForm />

      <p className="mt-6 text-center text-sm text-zinc-400">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-white hover:underline"
        >
          Login
        </Link>
      </p>
    </AuthCard>
  );
}