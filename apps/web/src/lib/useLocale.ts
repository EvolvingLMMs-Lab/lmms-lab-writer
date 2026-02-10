"use client";

import { usePathname } from "next/navigation";
import { detectLocale, type Locale } from "@/lib/i18n";

export function useLocale(): Locale {
  const pathname = usePathname();
  return detectLocale(pathname);
}
