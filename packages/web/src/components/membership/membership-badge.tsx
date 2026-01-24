import { MembershipTier } from "@/lib/github/config";

interface MembershipBadgeProps {
  tier: MembershipTier;
  daysRemaining?: number | null;
}

export function MembershipBadge({ tier, daysRemaining }: MembershipBadgeProps) {
  const isExpired =
    daysRemaining !== undefined && daysRemaining !== null && daysRemaining <= 0;

  if (tier === "supporter") {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="inline-flex items-center bg-black text-white px-3 py-1 text-xs font-mono uppercase tracking-widest border border-black">
          SUPPORTER
        </span>
        {daysRemaining !== null && daysRemaining !== undefined && (
          <span className="text-xs font-mono text-neutral-500 tabular-nums">
            {isExpired ? "EXPIRED" : `${daysRemaining}d`}
          </span>
        )}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center bg-neutral-100 text-neutral-500 px-3 py-1 text-xs font-mono uppercase tracking-widest border border-neutral-200">
      FREE
    </span>
  );
}
