"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RefreshStarsButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/refresh-stars", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        router.refresh();
      } else {
        setError(data.error || "Failed to refresh");
        console.error("Refresh failed:", data);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error";
      setError(message);
      console.error("Failed to refresh stars:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleRefresh}
        disabled={loading}
        className="text-xs text-muted hover:text-black transition-colors disabled:opacity-50 flex items-center gap-1"
        title={error || "Refresh star status"}
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
      {error && (
        <span className="text-xs text-red-600" title={error}>
          !
        </span>
      )}
    </div>
  );
}
