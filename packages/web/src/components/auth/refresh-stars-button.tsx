"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RefreshStarsButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRefresh = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/refresh-stars", {
        method: "POST",
      });

      if (response.ok) {
        // Refresh the page to show updated data
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to refresh stars:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={loading}
      className="text-xs text-muted hover:text-black transition-colors disabled:opacity-50 flex items-center gap-1"
      title="Refresh star status"
    >
      <svg
        className={`size-3.5 ${loading ? "animate-spin" : ""}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
      {loading ? "Refreshing..." : "Refresh"}
    </button>
  );
}
