"use client";

import { useEffect, useState, useCallback } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase";

export type MembershipTier = "free" | "supporter";

// Constants matching web app
const INKS_PER_STAR = 6;
const INKS_TO_DOWNLOAD = 15;

export type UserProfile = {
  email: string;
  name: string | null;
  avatarUrl: string | null;
  tier: MembershipTier;
  expiresAt: string | null;
  // Inks system (shared with web)
  inks: number;
  canDownload: boolean;
  totalStarCount: number;
};

type AuthState = {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  isConfigured: boolean;
};

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
    error: null,
    isConfigured: false,
  });

  const fetchProfile = useCallback(
    async (session: Session): Promise<UserProfile | null> => {
      try {
        const supabase = getSupabaseClient();
        const metadata = session.user.user_metadata || {};

        const { data: membership } = await supabase
          .from("user_memberships")
          .select("tier, expires_at, total_star_count")
          .eq("user_id", session.user.id)
          .single();

        const totalStarCount = membership?.total_star_count || 0;
        const inks = totalStarCount * INKS_PER_STAR;

        return {
          email: session.user.email ?? "",
          name:
            metadata.full_name || metadata.name || metadata.user_name || null,
          avatarUrl: metadata.avatar_url || metadata.picture || null,
          tier: (membership?.tier as MembershipTier) || "free",
          expiresAt: membership?.expires_at ?? null,
          inks,
          canDownload: inks >= INKS_TO_DOWNLOAD,
          totalStarCount,
        };
      } catch {
        return null;
      }
    },
    [],
  );

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | null = null;

    const init = async () => {
      try {
        const supabase = getSupabaseClient();

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (session) {
          const profile = await fetchProfile(session);
          setState({
            user: session.user,
            session,
            profile,
            loading: false,
            error: null,
            isConfigured: true,
          });
        } else {
          setState({
            user: null,
            session: null,
            profile: null,
            loading: false,
            error: null,
            isConfigured: true,
          });
        }

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
          // IMPORTANT: Do NOT await async operations here!
          // Blocking on database queries in this callback causes deadlock with setSession.
          // See: https://github.com/supabase/auth-js/issues/762
          if (!mounted) return;

          if (session) {
            // First, set state immediately without profile (non-blocking)
            setState({
              user: session.user,
              session,
              profile: null, // Will be fetched separately
              loading: false,
              error: null,
              isConfigured: true,
            });

            // Then fetch profile in a separate, non-blocking call
            // Using setTimeout to ensure this runs after the callback returns
            setTimeout(() => {
              if (!mounted) return;
              fetchProfile(session).then((profile) => {
                if (mounted) {
                  setState((prev) => ({ ...prev, profile }));
                }
              });
            }, 0);
          } else {
            setState({
              user: null,
              session: null,
              profile: null,
              loading: false,
              error: null,
              isConfigured: true,
            });
          }
        });

        // Store unsubscribe function for cleanup
        unsubscribe = () => subscription.unsubscribe();
      } catch (err) {
        if (!mounted) return;

        // Supabase not configured - graceful degradation
        setState({
          user: null,
          session: null,
          profile: null,
          loading: false,
          error:
            err instanceof Error ? err.message : "Auth initialization failed",
          isConfigured: false,
        });
      }
    };

    init();

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, [fetchProfile]);

  const signInWithGitHub = useCallback(async () => {
    try {
      const { open } = await import("@tauri-apps/plugin-shell");
      // Open web login page - let web handle OAuth flow so PKCE code_verifier is in browser cookies
      await open("https://writer.lmms-lab.com/login?source=desktop");
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "GitHub login failed",
      }));
    }
  }, []);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        const supabase = getSupabaseClient();

        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
      } catch (err) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : "Login failed",
        }));
      }
    },
    [],
  );

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const supabase = getSupabaseClient();

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: "https://writer.lmms-lab.com/auth/callback?source=desktop",
        },
      });

      if (error) throw error;

      return {
        success: true,
        message: "Check your email for the confirmation link",
      };
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Sign up failed",
      }));
      return {
        success: false,
        message: err instanceof Error ? err.message : "Sign up failed",
      };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Sign out failed",
      }));
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!state.session) return;
    const profile = await fetchProfile(state.session);
    setState((prev) => ({ ...prev, profile }));
  }, [state.session, fetchProfile]);

  const refreshAuth = useCallback(async () => {
    try {
      const supabase = getSupabaseClient();

      // First try getSession which checks stored session
      const { data: { session } } = await supabase.auth.getSession();
      console.log("[useAuth] refreshAuth - getSession result:", { hasSession: !!session });

      if (session) {
        const profile = await fetchProfile(session);
        setState({
          user: session.user,
          session,
          profile,
          loading: false,
          error: null,
          isConfigured: true,
        });
        return;
      }

      // If no stored session, try to get user from any cached access token
      // This handles the case where setSession failed but the access token is valid
      console.log("[useAuth] No stored session, trying getUser...");
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log("[useAuth] getUser result:", { hasUser: !!user, error: userError?.message });

      if (user && !userError) {
        // We have a valid user but no proper session
        // Create a minimal session-like object for the profile fetch
        const minimalSession = {
          user,
          access_token: "",
          refresh_token: "",
          expires_in: 0,
          expires_at: 0,
          token_type: "bearer",
        } as Session;

        const profile = await fetchProfile(minimalSession);
        setState({
          user,
          session: null, // No valid session, but user is authenticated
          profile,
          loading: false,
          error: null,
          isConfigured: true,
        });
        return;
      }

      // No session and no valid user
      setState({
        user: null,
        session: null,
        profile: null,
        loading: false,
        error: null,
        isConfigured: true,
      });
    } catch (err) {
      console.error("[useAuth] refreshAuth error:", err);
      // Silently fail - auth state remains unchanged
    }
  }, [fetchProfile]);

  // Set auth state using an access token directly (used when setSession fails)
  const setAuthWithToken = useCallback(async (accessToken: string) => {
    try {
      console.log("[useAuth] setAuthWithToken called");
      const supabase = getSupabaseClient();

      // Validate the access token and get user data
      const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
      console.log("[useAuth] getUser with token result:", { hasUser: !!user, error: userError?.message });

      if (userError || !user) {
        console.error("[useAuth] Token validation failed:", userError?.message);
        return false;
      }

      // Create a minimal session for profile fetching
      const minimalSession = {
        user,
        access_token: accessToken,
        refresh_token: "",
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: "bearer",
      } as Session;

      const profile = await fetchProfile(minimalSession);
      setState({
        user,
        session: minimalSession,
        profile,
        loading: false,
        error: null,
        isConfigured: true,
      });

      console.log("[useAuth] Auth state set successfully with token");
      return true;
    } catch (err) {
      console.error("[useAuth] setAuthWithToken error:", err);
      return false;
    }
  }, [fetchProfile]);

  return {
    ...state,
    signInWithGitHub,
    signInWithEmail,
    signUp,
    signOut,
    refreshProfile,
    refreshAuth,
    setAuthWithToken,
  };
}
