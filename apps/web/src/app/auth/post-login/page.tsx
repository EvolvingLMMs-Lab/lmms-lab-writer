"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PostLoginPage() {
  const router = useRouter();
  const [showDesktopError, setShowDesktopError] = useState(false);

  useEffect(() => {
    // Check if this was a desktop login (stored in sessionStorage as backup)
    const authSource = sessionStorage.getItem("auth_source");
    sessionStorage.removeItem("auth_source");

    if (authSource === "desktop") {
      // Desktop login via sessionStorage backup - tokens may not be available
      // Show error and ask user to try again with source param preserved
      setShowDesktopError(true);
    } else {
      // Normal web login - redirect to profile
      router.push("/profile");
    }
  }, [router]);

  if (showDesktopError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full p-8 text-center">
          <div className="w-12 h-12 border-2 border-yellow-500 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-yellow-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-medium mb-2">Login Incomplete</h1>
          <p className="text-muted text-sm mb-6">
            The login session couldn&apos;t be transferred to the desktop app.
            Please try logging in again from the desktop app.
          </p>
          <a
            href="/login?source=desktop"
            className="inline-block px-4 py-2 border-2 border-black bg-black text-white hover:bg-neutral-800 transition-colors"
          >
            Try Again
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full p-8 text-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent animate-spin mx-auto mb-4" />
        <h1 className="text-xl font-medium">Redirecting...</h1>
      </div>
    </div>
  );
}
