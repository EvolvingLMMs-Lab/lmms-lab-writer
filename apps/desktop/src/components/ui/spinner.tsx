import { CircleNotchIcon } from "@phosphor-icons/react";

export function Spinner({ className = "size-4" }: { className?: string }) {
  return <CircleNotchIcon className={`animate-spin ${className}`} />;
}
