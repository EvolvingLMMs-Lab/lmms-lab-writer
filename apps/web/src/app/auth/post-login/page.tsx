"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
        // Get current session and redirect to desktop-success
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          const params = new URLSearchParams({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          });
          setStatus("Redirecting to desktop app...");
          window.location.href = `/auth/desktop-success?${params}`;
          return;
        }
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
