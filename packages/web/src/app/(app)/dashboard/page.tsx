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
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
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
          <div className="border border-border p-12 text-center">
            <div className="max-w-sm mx-auto">
              <h2 className="text-xl font-light mb-2">No documents yet</h2>
              <p className="text-muted mb-6">
                Create your first LaTeX document to get started
              </p>
              <NewDocumentButton variant="primary" />
            </div>
          </div>
        ) : (
          <DocumentList documents={documents} />
        )}
      </main>
    </div>
  );
}
