"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PostLoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if this was a desktop login (stored in sessionStorage as backup)
    const authSource = sessionStorage.getItem("auth_source");
    sessionStorage.removeItem("auth_source");

    if (authSource === "desktop") {
      // Desktop login - redirect to desktop-success to show login code
      window.location.href = "/auth/desktop-success";
    } else {
      // Normal web login - redirect to profile
      router.push("/profile");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full p-8 text-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent animate-spin mx-auto mb-4" />
        <h1 className="text-xl font-medium">Redirecting...</h1>
      </div>
    </div>
  );
}
