"use client";

import { createBrowserClient } from "@/lib/supabase";
import type { Profile } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";

interface AuthState {
  user: Profile | null;
  loading: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  phone_number: string;
  role: "admin" | "accountant" | "clerk" | "user";
}

export function useAuth() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = useMemo(() => createBrowserClient(), []);
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
  });

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data as Profile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }, [supabase]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          setState({ user: null, loading: false });
          return;
        }

        const profile = await fetchProfile(user.id);
        setState({ user: profile, loading: false });
      } catch (error) {
        setState({ user: null, loading: false });
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setState({ user: profile, loading: false });
        } else {
          setState({ user: null, loading: false });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const profile = await fetchProfile(data.user.id);
        setState({ user: profile, loading: false });
        toast({
          title: "Success",
          description: "Logged in successfully",
        });
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to sign in",
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setState({ user: null, loading: false });
      router.push("/login");
      router.refresh();
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to sign out",
      });
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name,
            phone_number: userData.phone_number,
            role: userData.role,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            full_name: userData.full_name,
            email: userData.email,
            phone_number: userData.phone_number,
            role: userData.role,
          });

        if (profileError) throw profileError;

        toast({
          title: "Success",
          description: "User registered successfully",
        });
        router.push("/login");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to register",
      });
      throw error;
    }
  };

  return {
    user: state.user,
    loading: state.loading,
    signIn,
    signOut,
    register,
  };
}