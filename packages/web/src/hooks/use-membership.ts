"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { MembershipTier, StarredRepo } from "@/lib/github/config";

interface MembershipStatus {
  connected: boolean;
  username: string | null;
  avatarUrl: string | null;
  connectedAt: string | null;
  membership: {
    tier: MembershipTier;
    expiresAt: string | null;
    daysRemaining: number | null;
    starredRepos: StarredRepo[];
    totalStarCount: number;
    lastStarCheck: string | null;
  };
}

interface UseMembershipReturn {
  tier: MembershipTier;
  expiresAt: Date | null;
  daysRemaining: number | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hasFeature: (feature: FeatureKey) => boolean;
  connected: boolean;
  username: string | null;
  avatarUrl: string | null;
  starredRepos: StarredRepo[];
  totalStarCount: number;
}

const FEATURE_ACCESS: Record<FeatureKey, MembershipTier[]> = {
  unlimited_docs: ["supporter"],
  ai_suggestions: ["supporter"],
  priority_compile: ["supporter"],
};

export type FeatureKey =
  | "unlimited_docs"
  | "ai_suggestions"
  | "priority_compile";

export function useMembership(): UseMembershipReturn {
  const [status, setStatus] = useState<MembershipStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembership = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/github/status");

      if (!response.ok) {
        if (response.status === 401) {
          // Not authenticated - return free tier defaults
          setStatus({
            connected: false,
            username: null,
            avatarUrl: null,
            connectedAt: null,
            membership: {
              tier: "free",
              expiresAt: null,
              daysRemaining: null,
              starredRepos: [],
              totalStarCount: 0,
              lastStarCheck: null,
            },
          });
          return;
        }
        throw new Error(`Failed to fetch membership: ${response.statusText}`);
      }

      const data: MembershipStatus = await response.json();
      setStatus(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      // Set defaults on error
      setStatus({
        connected: false,
        username: null,
        avatarUrl: null,
        connectedAt: null,
        membership: {
          tier: "free",
          expiresAt: null,
          daysRemaining: null,
          starredRepos: [],
          totalStarCount: 0,
          lastStarCheck: null,
        },
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembership();
  }, [fetchMembership]);

  const hasFeature = useCallback(
    (feature: FeatureKey): boolean => {
      const tier = status?.membership.tier ?? "free";
      const allowedTiers = FEATURE_ACCESS[feature];
      return allowedTiers.includes(tier);
    },
    [status?.membership.tier],
  );

  const result = useMemo(
    (): UseMembershipReturn => ({
      tier: status?.membership.tier ?? "free",
      expiresAt: status?.membership.expiresAt
        ? new Date(status.membership.expiresAt)
        : null,
      daysRemaining: status?.membership.daysRemaining ?? null,
      isLoading,
      error,
      refetch: fetchMembership,
      hasFeature,
      connected: status?.connected ?? false,
      username: status?.username ?? null,
      avatarUrl: status?.avatarUrl ?? null,
      starredRepos: status?.membership.starredRepos ?? [],
      totalStarCount: status?.membership.totalStarCount ?? 0,
    }),
    [status, isLoading, error, fetchMembership, hasFeature],
  );

  return result;
}
