import type { MembershipTier } from "@/lib/github/config";

type MembershipEvent =
  | { type: "github_connected"; github_username: string }
  | { type: "star_detected"; repo: string; total_stars: number }
  | {
      type: "membership_upgraded";
      from_tier: MembershipTier;
      to_tier: MembershipTier;
      star_count: number;
    }
  | { type: "membership_expired"; tier: MembershipTier }
  | { type: "feature_gated"; feature: string; tier: MembershipTier }
  | { type: "upgrade_prompt_shown"; feature: string; tier: MembershipTier }
  | {
      type: "upgrade_prompt_clicked";
      feature: string;
      action: "connect_github" | "view_pricing";
    };

export function trackMembershipEvent(event: MembershipEvent): void {
  if (typeof window === "undefined") return;

  const payload = {
    ...event,
    timestamp: new Date().toISOString(),
    url: window.location.href,
  };

  if (process.env.NODE_ENV === "development") {
    console.log("[Analytics]", payload);
    return;
  }

  if (typeof window.gtag === "function") {
    window.gtag("event", event.type, payload);
  }

  if (typeof window.plausible === "function") {
    window.plausible(event.type, { props: payload });
  }
}

export function trackGitHubConnected(username: string): void {
  trackMembershipEvent({ type: "github_connected", github_username: username });
}

export function trackStarDetected(repo: string, totalStars: number): void {
  trackMembershipEvent({
    type: "star_detected",
    repo,
    total_stars: totalStars,
  });
}

export function trackMembershipUpgrade(
  fromTier: MembershipTier,
  toTier: MembershipTier,
  starCount: number,
): void {
  trackMembershipEvent({
    type: "membership_upgraded",
    from_tier: fromTier,
    to_tier: toTier,
    star_count: starCount,
  });
}

export function trackFeatureGated(feature: string, tier: MembershipTier): void {
  trackMembershipEvent({ type: "feature_gated", feature, tier });
}

export function trackUpgradePromptShown(
  feature: string,
  tier: MembershipTier,
): void {
  trackMembershipEvent({ type: "upgrade_prompt_shown", feature, tier });
}

export function trackUpgradePromptClicked(
  feature: string,
  action: "connect_github" | "view_pricing",
): void {
  trackMembershipEvent({ type: "upgrade_prompt_clicked", feature, action });
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    plausible?: (
      event: string,
      options?: { props: Record<string, unknown> },
    ) => void;
  }
}
