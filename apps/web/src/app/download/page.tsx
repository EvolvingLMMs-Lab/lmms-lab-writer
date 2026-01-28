import Link from "next/link";
import { Suspense } from "react";
import { Header } from "@/components/header";
import { createClient } from "@/lib/supabase/server";
import { GITHUB_CONFIG, canDownload } from "@/lib/github/config";
import {
  DownloadSection,
  RequirementsSection,
  BuildSection,
  InksGate,
} from "@/components/download-sections";

function DownloadSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-6 w-48 bg-neutral-100 mb-4" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 w-64 bg-neutral-50" />
        ))}
      </div>
    </div>
  );
}

async function DownloadContent() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return (
      <InksGate
        inks={0}
        requiredInks={GITHUB_CONFIG.INKS_TO_DOWNLOAD}
        isLoggedIn={false}
      />
    );
  }

  const { data: membershipData } = await supabase
    .from("user_memberships")
    .select("total_star_count")
    .eq("user_id", session.user.id)
    .single();

  const totalStars = membershipData?.total_star_count || 0;
  const inks = totalStars * GITHUB_CONFIG.INKS_PER_STAR;
  const hasEnoughInks = canDownload(inks);

  if (!hasEnoughInks) {
    return (
      <InksGate
        inks={inks}
        requiredInks={GITHUB_CONFIG.INKS_TO_DOWNLOAD}
        isLoggedIn={true}
      />
    );
  }

  return (
    <>
      <div className="border border-black bg-neutral-50 p-4 mb-8 max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">
              You have {inks} inks - ready to download
            </p>
            <p className="text-xs text-muted mt-1">
              Beta period: No inks deducted when you download or use the app
            </p>
          </div>
          <span className="text-xs font-mono text-muted uppercase tracking-wider">
            {inks} inks
          </span>
        </div>
      </div>
      <DownloadSection />
      <RequirementsSection />
      <BuildSection />
    </>
  );
}

export default function DownloadPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-medium tracking-tight mb-2">Download</h1>
          <p className="text-muted mb-10">Version 0.1.0</p>

          <Suspense fallback={<DownloadSkeleton />}>
            <DownloadContent />
          </Suspense>
        </div>
      </main>

      <footer className="border-t border-border px-6">
        <div className="max-w-5xl mx-auto py-6 text-sm text-muted">
          Built by{" "}
          <Link
            href="https://www.lmms-lab.com/"
            className="hover:text-foreground transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            LMMs-Lab
          </Link>
        </div>
      </footer>
    </div>
  );
}
