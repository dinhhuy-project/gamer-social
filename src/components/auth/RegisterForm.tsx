"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export function RegisterForm() {
  const router = useRouter();

  const supabase = createClient();

  const [username, setUsername] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleRegister(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setLoading(true);

    setError("");

    const { error } =
      await supabase.auth.signUp({
        email,
        password,

        options: {
          data: {
            username,
            full_name: username,
          },
        },
      });

    if (error) {
      setError(error.message);

      setLoading(false);

      return;
    }

    router.push("/feed");

    router.refresh();
  }

  return (
    <form
      onSubmit={handleRegister}
      className="space-y-4"
    >
      <div>
        <label className="mb-2 block text-sm text-zinc-300">
          Username
        </label>

        <input
          required
          value={username}
          onChange={(e) =>
            setUsername(e.target.value)
          }
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-white outline-none"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm text-zinc-300">
          Email
        </label>

        <input
          type="email"
          required
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-white outline-none"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm text-zinc-300">
          Password
        </label>

        <input
          type="password"
          required
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-white outline-none"
        />
      </div>

      {error && (
        <p className="text-sm text-red-500">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-white py-3 font-medium text-black transition hover:opacity-90"
      >
        {loading
          ? "Creating account..."
          : "Create account"}
      </button>
    </form>
  );
}