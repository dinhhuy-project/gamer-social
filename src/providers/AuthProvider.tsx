"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";

type AuthContextType = {
  user: User | null;
  loading: boolean;
};

const AuthContext =
  createContext<AuthContextType>({
    user: null,
    loading: true,
  });

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

  const [user, setUser] =
    useState<User | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function getSession() {
      const {
        data: { session },
      } =
        await supabase.auth.getSession();

      setUser(session?.user ?? null);

      setLoading(false);
    }

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () =>
      subscription.unsubscribe();
  }, [supabase]);

  return (
    <AuthContext.Provider
      value={{ user, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}