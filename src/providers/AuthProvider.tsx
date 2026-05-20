"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { CurrentUser } from "@/types/api.types";

type AuthContextType = {
  supabaseUser: User | null;
  profile: CurrentUser | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  supabaseUser: null, profile: null, isLoading: true, signOut: async () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  async function fetchProfile() {
    try {
      const res = await fetch("/api/me");
      if (res.ok) setProfile(await res.json());
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setSupabaseUser(user);
      if (user) fetchProfile(); else setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseUser(session?.user ?? null);
      if (session?.user) fetchProfile();
      else { setProfile(null); setIsLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
    setSupabaseUser(null);
    window.location.href = "/login";
  }

  return (
    <AuthContext.Provider value={{ supabaseUser, profile, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
