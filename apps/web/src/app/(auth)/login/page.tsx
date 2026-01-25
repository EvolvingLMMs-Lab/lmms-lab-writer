"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const LoginForm = dynamic(
  () => import("@/components/auth/login-form").then((m) => m.LoginForm),
  { ssr: false },
);

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center">
      <div className="w-full max-w-5xl mx-auto px-6">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          <h1 className="text-2xl font-semibold mb-2">Sign in</h1>
          <p className="text-sm text-muted mb-8">
            Access your license and membership features.
          </p>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}
