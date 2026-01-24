import Link from "next/link";
import { cn } from "@/lib/utils";

const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="square"
    strokeLinejoin="miter"
    className={cn("size-5", className)}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const DashIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="square"
    strokeLinejoin="miter"
    className={cn("size-5 text-muted", className)}
  >
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export function PricingTable() {
  return (
    <div className="grid md:grid-cols-3 gap-0 border border-black bg-white">
      {/* Free Tier */}
      <div className="p-8 border-b md:border-b-0 md:border-r border-neutral-200 flex flex-col">
        <div className="mb-8">
          <h3 className="text-xl font-bold uppercase tracking-widest mb-2">
            Free
          </h3>
          <div className="text-4xl font-mono font-bold">$0</div>
          <p className="text-sm text-muted mt-2">For simple edits</p>
        </div>

        <ul className="space-y-4 mb-8 flex-1">
          <li className="flex items-center gap-3 text-sm">
            <span className="font-mono font-bold">3</span> Cloud Docs
          </li>
          <li className="flex items-center gap-3 text-sm">
            <CheckIcon /> Git Versioning
          </li>
          <li className="flex items-center gap-3 text-sm text-muted">
            <DashIcon /> AI Chat
          </li>
          <li className="flex items-center gap-3 text-sm text-muted">
            <DashIcon /> Team Collab
          </li>
          <li className="flex items-center gap-3 text-sm">
            <span className="font-mono font-bold">50MB</span> Storage
          </li>
        </ul>

        <Link href="/signup" className="btn btn-outline w-full">
          Start Free
        </Link>
      </div>

      {/* Member Tier */}
      <div className="p-8 border-b md:border-b-0 md:border-r border-black bg-neutral-50 flex flex-col relative">
        <div className="absolute top-0 right-0 bg-black text-white text-xs px-2 py-1 font-mono uppercase">
          Most Popular
        </div>
        <div className="mb-8">
          <h3 className="text-xl font-bold uppercase tracking-widest mb-2">
            Member
          </h3>
          <div className="text-4xl font-mono font-bold">$0</div>
          <p className="text-sm text-muted mt-2">Just star our repos</p>
        </div>

        <ul className="space-y-4 mb-8 flex-1">
          <li className="flex items-center gap-3 text-sm">
            <span className="font-mono font-bold">Unlimited</span> Docs
          </li>
          <li className="flex items-center gap-3 text-sm">
            <CheckIcon /> Git Versioning
          </li>
          <li className="flex items-center gap-3 text-sm">
            <CheckIcon /> AI Chat
          </li>
          <li className="flex items-center gap-3 text-sm">
            <CheckIcon /> Team Collab
          </li>
          <li className="flex items-center gap-3 text-sm">
            <span className="font-mono font-bold">100MB</span> Storage
          </li>
        </ul>

        <Link
          href="https://github.com/EvolvingLMMs-Lab"
          target="_blank"
          className="btn btn-primary w-full"
        >
          Star to Join
        </Link>
      </div>

      {/* Pro Tier */}
      <div className="p-8 flex flex-col">
        <div className="mb-8">
          <h3 className="text-xl font-bold uppercase tracking-widest mb-2">
            Pro
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-mono font-bold">$9</span>
            <span className="text-muted text-sm">/mo</span>
          </div>
          <p className="text-sm text-muted mt-2">Or 10+ stars on GitHub</p>
        </div>

        <ul className="space-y-4 mb-8 flex-1">
          <li className="flex items-center gap-3 text-sm">
            <span className="font-mono font-bold">Unlimited</span> Docs
          </li>
          <li className="flex items-center gap-3 text-sm">
            <CheckIcon /> Git Versioning
          </li>
          <li className="flex items-center gap-3 text-sm">
            <CheckIcon /> AI Chat (GPT-4)
          </li>
          <li className="flex items-center gap-3 text-sm">
            <CheckIcon /> Priority Support
          </li>
          <li className="flex items-center gap-3 text-sm">
            <span className="font-mono font-bold">1GB</span> Storage
          </li>
        </ul>

        <Link href="/dashboard/billing" className="btn btn-outline w-full">
          Upgrade
        </Link>
      </div>
    </div>
  );
}
