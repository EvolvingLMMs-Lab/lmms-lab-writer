"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PostLoginPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Processing login...");

  useEffect(() => {
    const handlePostLogin = async () => {
      const authSource = sessionStorage.getItem("auth_source");
      console.log("[post-login] auth_source from sessionStorage:", authSource);

      // Clear the stored source
      sessionStorage.removeItem("auth_source");

      if (authSource === "desktop") {
        // Redirect to desktop-success, which will fetch tokens from session
        setStatus("Redirecting to desktop app...");
        window.location.href = `/auth/desktop-success`;
        return;
      }

      // Default: redirect to profile
      setStatus("Redirecting to profile...");
      router.push("/profile");
    };

    handlePostLogin();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full p-8 text-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent animate-spin mx-auto mb-4" />
        <h1 className="text-xl font-medium">{status}</h1>
      </div>
    </div>
  );
}
