"use client";

import { Suspense, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { m } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

const LoginForm = dynamic(
  () => import("@/components/auth/login-form").then((m) => m.LoginForm),
  { ssr: false },
);

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      delay,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  }),
};

function ErrorMessage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  if (!error) return null;

  return (
    <m.div
      initial="hidden"
      animate="visible"
      custom={0.18}
      variants={fadeIn}
      className="mb-4 p-3 border border-red-200 bg-red-50 text-red-700 text-sm"
    >
      {decodeURIComponent(error)}
    </m.div>
  );
}

function LoginPageContent() {
  const searchParams = useSearchParams();
  const source = searchParams.get("source");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      if (source !== "desktop") {
        setReady(true);
        return;
      }

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // Already logged in, redirect to desktop-success with tokens
        const params = new URLSearchParams({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });
        window.location.href = `/auth/desktop-success?${params}`;
      } else {
        setReady(true);
      }
    };

    checkSession();
  }, [source]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-black border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted">Checking login status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <m.div initial="hidden" animate="visible" custom={0} variants={fadeIn}>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </m.div>

        <m.h1
          className="text-2xl font-semibold mb-2"
          initial="hidden"
          animate="visible"
          custom={0.1}
          variants={fadeIn}
        >
          Sign in
        </m.h1>
        <m.p
          className="text-sm text-muted mb-8"
          initial="hidden"
          animate="visible"
          custom={0.15}
          variants={fadeIn}
        >
          Access your license and membership features.
        </m.p>

        <Suspense fallback={null}>
          <ErrorMessage />
        </Suspense>

        <m.div
          initial="hidden"
          animate="visible"
          custom={0.2}
          variants={fadeIn}
        >
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </m.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-black border-t-transparent animate-spin" />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
