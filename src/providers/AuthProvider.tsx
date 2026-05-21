"use client";

import { createContext, useContext, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "@/hooks/auth/useCurrentUser";
import type { CurrentUser } from "@/types/api.types";

type AuthContextType = {
  user: CurrentUser | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useCurrentUser();

  useEffect(() => {
    // When Supabase client auth state changes, invalidate `me` so useCurrentUser refetches
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
    });

    return () => subscription.unsubscribe();
  }, [supabase, queryClient]);

  return <AuthContext.Provider value={{ user: user ?? null, loading: isLoading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}