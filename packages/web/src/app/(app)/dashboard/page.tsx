import { Header } from "@/components/header";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

import { DocumentList } from "./document-list";
import { NewDocumentButton } from "./new-document-button";

type Document = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  role: "owner" | "editor" | "viewer";
};

type OwnedDoc = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

type SharedAccess = {
  document_id: string;
  role: string;
  documents: OwnedDoc | null;
};

async function getDashboardData(): Promise<{
  documents: Document[];
}> {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Parallel database queries
  const [ownedDocsResult, sharedAccessResult] = await Promise.all([
    supabase
      .from("documents")
      .select("id, title, created_at, updated_at")
      .eq("created_by", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("document_access")
      .select("document_id, role, documents(id, title, created_at, updated_at)")
      .eq("user_id", userId),
  ]);

  const ownedDocs = ownedDocsResult.data;
  const sharedAccess = sharedAccessResult.data;

  const owned: Document[] = (ownedDocs ?? []).map((doc: OwnedDoc) => ({
    ...doc,
    role: "owner" as const,
  }));

  const shared: Document[] = ((sharedAccess ?? []) as unknown as SharedAccess[])
    .filter((a) => a.documents)
    .map((a) => ({
      ...a.documents!,
      role: a.role as "editor" | "viewer",
    }));

  const documents = [...owned, ...shared].sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  );

  return { documents };
}

export default async function DashboardPage() {
  const { documents } = await getDashboardData();

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-light tracking-tight">Documents</h1>
        </div>

        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 border border-dashed border-neutral-300 bg-neutral-50/50">
            <div className="relative w-16 h-20 mb-8 group cursor-default">
              <div className="absolute inset-0 bg-neutral-200 border border-neutral-300 translate-x-2 translate-y-2 transition-transform duration-300 group-hover:translate-x-3 group-hover:translate-y-3" />
              <div className="absolute inset-0 bg-white border-2 border-black flex flex-col p-3 shadow-sm">
                <div className="w-1/2 h-1 bg-black mb-2" />
                <div className="w-full h-0.5 bg-neutral-200 mb-1" />
                <div className="w-full h-0.5 bg-neutral-200 mb-1" />
                <div className="w-3/4 h-0.5 bg-neutral-200" />
                <div className="mt-auto self-end text-black font-mono text-xs leading-none">
                  +
                </div>
              </div>
            </div>

            <h2 className="text-lg font-mono font-bold uppercase tracking-widest text-black mb-2">
              Tabula Rasa
            </h2>

            <p className="text-muted font-mono text-sm mb-8 max-w-xs text-center leading-relaxed">
              The archive is empty. Initialize a new document to begin
              compilation.
            </p>

            <NewDocumentButton variant="primary" />
          </div>
        ) : (
          <DocumentList documents={documents} />
        )}
      </main>
    </div>
  );
}
