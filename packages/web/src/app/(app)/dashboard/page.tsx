import { UserDropdown } from "@/components/user-dropdown";
import { getDaysRemaining } from "@/lib/github/config";
import { createClient } from "@/lib/supabase/server";
import type { Session } from "@supabase/supabase-js";
import Link from "next/link";
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

type UserProfile = {
  email: string;
  name: string | null;
  avatarUrl: string | null;
  tier: "free" | "supporter";
  daysRemaining: number | null;
};

function getUserProfile(
  session: Session,
  membership: { tier: string; expires_at: string | null } | null
): UserProfile {
  const metadata = session.user.user_metadata || {};
  const expiresAt = membership?.expires_at
    ? new Date(membership.expires_at)
    : null;

  return {
    email: session.user.email ?? "",
    name: metadata.full_name || metadata.name || metadata.user_name || null,
    avatarUrl: metadata.avatar_url || metadata.picture || null,
    tier: (membership?.tier as "free" | "supporter") || "free",
    daysRemaining: getDaysRemaining(expiresAt),
  };
}

async function getDashboardData(): Promise<{
  documents: Document[];
  profile: UserProfile;
  documentsCount: number;
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
  const [ownedDocsResult, sharedAccessResult, membershipResult] =
    await Promise.all([
      supabase
        .from("documents")
        .select("id, title, created_at, updated_at")
        .eq("created_by", userId)
        .order("updated_at", { ascending: false }),
      supabase
        .from("document_access")
        .select("document_id, role, documents(id, title, created_at, updated_at)")
        .eq("user_id", userId),
      supabase
        .from("user_memberships")
        .select("tier, expires_at")
        .eq("user_id", userId)
        .single(),
    ]);

  const profile = getUserProfile(session, membershipResult.data);

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

  return {
    documents,
    profile,
    documentsCount: owned.length,
  };
}

export default async function DashboardPage() {
  const { documents, profile, documentsCount } = await getDashboardData();

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-background sticky top-0 z-50 h-[72px] flex items-center">
        <div className="w-full max-w-5xl mx-auto px-6 flex items-center justify-between">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight uppercase flex items-center gap-3"
          >
            <div className="logo-bar text-foreground">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
            LMMs-Lab Writer
          </Link>
          <div className="flex items-center gap-4">
            <NewDocumentButton />
            <UserDropdown
              email={profile.email}
              name={profile.name}
              avatarUrl={profile.avatarUrl}
              tier={profile.tier}
              daysRemaining={profile.daysRemaining}
              documentsCount={documentsCount}
            />
          </div>
        </div>
      </header>

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
