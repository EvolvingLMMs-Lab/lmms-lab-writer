"use client";

import { Plus } from "lucide-react";
import Link from "next/link";

export function NewDocumentButton() {
  return (
    <Link
      href="/download"
      className="inline-flex items-center gap-2 px-4 py-2 border-2 border-black text-sm font-medium hover:bg-neutral-100 transition-colors"
    >
      <Plus className="size-4" />
      New Document
    </Link>
  );
}
