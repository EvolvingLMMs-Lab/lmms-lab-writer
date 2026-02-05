import { CircleNotch } from "@phosphor-icons/react";

export function Spinner({ className = "size-4" }: { className?: string }) {
  return <CircleNotch className={`animate-spin ${className}`} />;
}
