import { redirect } from "next/navigation";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n";

export default async function LocaleFallback({
  params,
}: {
  params: Promise<{ locale: string; rest: string[] }>;
}) {
  const { locale, rest } = await params;

  if (!isLocale(locale) || locale === DEFAULT_LOCALE) {
    // Not a valid locale prefix — let Next.js 404 naturally
    return redirect(`/${rest.join("/")}`);
  }

  // Fall back to the English version of this page
  redirect(`/${rest.join("/")}`);
}
