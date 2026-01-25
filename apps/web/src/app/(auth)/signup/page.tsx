"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const SignupForm = dynamic(
  () => import("@/components/auth/signup-form").then((m) => m.SignupForm),
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

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center px-6">
      <div className="w-full max-w-5xl mx-auto">
        <div className="w-full max-w-sm">
          <motion.div
            initial="hidden"
            animate="visible"
            custom={0}
            variants={fadeIn}
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </Link>
          </motion.div>

          <motion.h1
            className="text-2xl font-semibold mb-2"
            initial="hidden"
            animate="visible"
            custom={0.1}
            variants={fadeIn}
          >
            Create an account
          </motion.h1>
          <motion.p
            className="text-sm text-muted mb-8"
            initial="hidden"
            animate="visible"
            custom={0.15}
            variants={fadeIn}
          >
            Get access to license management and premium features.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            custom={0.2}
            variants={fadeIn}
          >
            <SignupForm />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
