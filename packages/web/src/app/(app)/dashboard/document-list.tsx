"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type Document = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  role: "owner" | "editor" | "viewer";
  sort_order?: number;
};

type Props = {
  documents: Document[];
};

function formatDate(date: string): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DocumentList({ documents: initialDocuments }: Props) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = useCallback(
    async (docId: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!confirm("Delete this document? This cannot be undone.")) {
        return;
      }

      setIsDeleting(docId);
      setActiveMenu(null);

      const supabase = createClient();
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", docId);

      if (!error) {
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
      }

      setIsDeleting(null);
    },
    []
  );

  const handleMoveUp = useCallback(
    async (index: number, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (index === 0) return;

      const newDocs = [...documents];
      [newDocs[index - 1], newDocs[index]] = [newDocs[index], newDocs[index - 1]];
      setDocuments(newDocs);
      setActiveMenu(null);

      // Update sort order in database
      const supabase = createClient();
      await Promise.all(
        newDocs.map((doc, i) =>
          supabase
            .from("documents")
            .update({ sort_order: i })
            .eq("id", doc.id)
        )
      );
    },
    [documents]
  );

  const handleMoveDown = useCallback(
    async (index: number, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (index === documents.length - 1) return;

      const newDocs = [...documents];
      [newDocs[index], newDocs[index + 1]] = [newDocs[index + 1], newDocs[index]];
      setDocuments(newDocs);
      setActiveMenu(null);

      // Update sort order in database
      const supabase = createClient();
      await Promise.all(
        newDocs.map((doc, i) =>
          supabase
            .from("documents")
            .update({ sort_order: i })
            .eq("id", doc.id)
        )
      );
    },
    [documents]
  );

  const toggleMenu = useCallback((docId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveMenu((prev) => (prev === docId ? null : docId));
  }, []);

  // Close menu when clicking outside
  const handleClickOutside = useCallback(() => {
    setActiveMenu(null);
  }, []);

  if (documents.length === 0) {
    return null;
  }

  return (
    <div
      className="border border-border divide-y divide-border"
      onClick={handleClickOutside}
    >
      {documents.map((doc, index) => (
        <div
          key={doc.id}
          className={`flex items-center justify-between p-4 hover:bg-accent-hover transition-colors group relative ${
            isDeleting === doc.id ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <Link
            href={`/editor/${doc.id}`}
            className="flex items-center gap-4 flex-1 min-w-0"
          >
            <div className="size-10 border border-border flex items-center justify-center group-hover:border-black transition-colors flex-shrink-0">
              <svg
                className="w-5 h-5 text-muted group-hover:text-black transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="font-medium truncate">{doc.title}</h3>
              <p className="text-sm text-muted">
                {doc.role !== "owner" && (
                  <span className="mr-2 text-xs uppercase tracking-wider">
                    {doc.role}
                  </span>
                )}
                {formatDate(doc.updated_at)}
              </p>
            </div>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {doc.role === "owner" && (
              <div className="relative">
                <button
                  onClick={(e) => toggleMenu(doc.id, e)}
                  className="p-2 text-muted hover:text-black transition-colors opacity-0 group-hover:opacity-100"
                  title="More actions"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                    />
                  </svg>
                </button>

                {/* Dropdown menu */}
                {activeMenu === doc.id && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-border shadow-lg z-10 min-w-[140px]">
                    <button
                      onClick={(e) => handleMoveUp(index, e)}
                      disabled={index === 0}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                      Move up
                    </button>
                    <button
                      onClick={(e) => handleMoveDown(index, e)}
                      disabled={index === documents.length - 1}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                      Move down
                    </button>
                    <div className="border-t border-border" />
                    <button
                      onClick={(e) => handleDelete(doc.id, e)}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}

            <Link
              href={`/editor/${doc.id}`}
              className="p-2 text-muted group-hover:text-black transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                  strokeWidth={1.5}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
