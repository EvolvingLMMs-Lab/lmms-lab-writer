import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { Header } from "@/components/header";
import { createClient } from "@/lib/supabase/server";
import { GITHUB_CONFIG, canDownload } from "@/lib/github/config";
import {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  isLocale,
  interpolate,
  type Locale,
} from "@/lib/i18n";
import { getMessages } from "@/lib/messages";
import {
  InstallationPolicySection,
  DownloadSection,
  HomebrewSection,
  RELEASE_VERSION,
  NpmPackageSection,
  InstallationSection,
  RequirementsSection,
  BuildSection,
  InksGate,
} from "@/components/download-sections";

export function generateStaticParams() {
  return SUPPORTED_LOCALES.filter((l) => l !== DEFAULT_LOCALE).map(
    (locale) => ({ locale }),
  );
}

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

async function DownloadContent({ locale }: { locale: Locale }) {
  const messages = getMessages(locale).download;
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
        locale={locale}
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
        locale={locale}
      />
    );
  }

  return (
    <>
      <div className="border border-black bg-neutral-50 p-4 mb-8 max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">
              {interpolate(messages.readyBannerTitle, { inks })}
            </p>
            <p className="text-xs text-muted mt-1">
              {messages.readyBannerNote}
            </p>
          </div>
          <span className="text-xs font-mono text-muted uppercase tracking-wider">
            {inks} inks
          </span>
        </div>
      </div>
      <HomebrewSection locale={locale} />
      <DownloadSection locale={locale} />
      <NpmPackageSection locale={locale} />
      <InstallationSection locale={locale} />
      <RequirementsSection locale={locale} />
      <BuildSection locale={locale} />
    </>
  );
}

export default async function LocaleDownloadPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale) || rawLocale === DEFAULT_LOCALE) {
    notFound();
  }

  const locale: Locale = rawLocale;
  const messages = getMessages(locale).download;

  return (
    <div className="min-h-screen flex flex-col">
      <Header locale={locale} showLanguageSwitcher />

      <main className="flex-1 py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-medium tracking-tight mb-2">
            {messages.pageTitle}
          </h1>
          <p className="text-muted mb-6">
            {messages.versionLabel} {RELEASE_VERSION}
          </p>

          <InstallationPolicySection locale={locale} />

          <Suspense fallback={<DownloadSkeleton />}>
            <DownloadContent locale={locale} />
          </Suspense>
        </div>
      </main>

      <footer className="border-t border-border px-6">
        <div className="max-w-5xl mx-auto py-6 text-sm text-muted">
          {getMessages(locale).footer.builtBy}{" "}
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
