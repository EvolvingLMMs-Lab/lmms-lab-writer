import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { getStoredGitHubToken } from "@/lib/github/stars";
import { listUserRepos, getRepo, GitHubAPIError } from "@/lib/github/git-api";

interface LinkRepoRequest {
  documentId: string;
  owner: string;
  repo: string;
  branch?: string;
  pathPrefix?: string;
}

/**
 * GET /api/github/repos
 * List user's GitHub repositories with push access
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get stored GitHub token
  const tokenInfo = await getStoredGitHubToken(supabase, user.id);
  if (!tokenInfo) {
    return NextResponse.json(
      {
        error: "GitHub not connected",
        message: "Please connect your GitHub account first",
      },
      { status: 400 },
    );
  }

  // Parse query params
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const perPage = Math.min(
    parseInt(searchParams.get("per_page") || "30", 10),
    100,
  );

  try {
    const { repos, rateLimit } = await listUserRepos(tokenInfo.accessToken, {
      page,
      perPage,
    });

    return NextResponse.json({
      repos: repos.map((repo) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        private: repo.private,
        description: repo.description,
        htmlUrl: repo.html_url,
        defaultBranch: repo.default_branch,
        updatedAt: repo.updated_at,
        pushedAt: repo.pushed_at,
      })),
      rateLimit: rateLimit
        ? {
            remaining: rateLimit.remaining,
            limit: rateLimit.limit,
            reset: new Date(rateLimit.reset * 1000).toISOString(),
          }
        : null,
      pagination: {
        page,
        perPage,
        hasMore: repos.length === perPage,
      },
    });
  } catch (error) {
    if (error instanceof GitHubAPIError) {
      if (error.status === 401) {
        return NextResponse.json(
          {
            error: "GitHub token expired",
            message: "Please reconnect your GitHub account",
          },
          { status: 401 },
        );
      }
      if (error.status === 429) {
        return NextResponse.json(
          {
            error: "Rate limit exceeded",
            message: error.message,
            rateLimit: error.rateLimit,
          },
          { status: 429 },
        );
      }
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch repositories", details: message },
      { status: 500 },
    );
  }
}

/**
 * POST /api/github/repos
 * Link a GitHub repository to a document
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get stored GitHub token
  const tokenInfo = await getStoredGitHubToken(supabase, user.id);
  if (!tokenInfo) {
    return NextResponse.json(
      {
        error: "GitHub not connected",
        message: "Please connect your GitHub account first",
      },
      { status: 400 },
    );
  }

  // Parse request body
  let body: LinkRepoRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const { documentId, owner, repo, branch, pathPrefix } = body;

  if (!documentId || !owner || !repo) {
    return NextResponse.json(
      { error: "Missing required fields: documentId, owner, repo" },
      { status: 400 },
    );
  }

  // Verify document ownership
  const { data: document, error: docError } = await supabase
    .from("documents")
    .select("id, created_by")
    .eq("id", documentId)
    .single();

  if (docError || !document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (document.created_by !== user.id) {
    return NextResponse.json(
      { error: "You can only link repos to your own documents" },
      { status: 403 },
    );
  }

  // Verify repo exists and user has push access
  try {
    const { repo: repoInfo } = await getRepo(
      tokenInfo.accessToken,
      owner,
      repo,
    );

    if (!repoInfo.permissions?.push) {
      return NextResponse.json(
        {
          error: "Insufficient permissions",
          message: "You need push access to link this repository",
        },
        { status: 403 },
      );
    }

    // Upsert the repo link
    const { data: link, error: linkError } = await supabase
      .from("document_github_repos")
      .upsert(
        {
          document_id: documentId,
          owner,
          repo,
          branch: branch || repoInfo.default_branch,
          path_prefix: pathPrefix || "",
        },
        { onConflict: "document_id" },
      )
      .select()
      .single();

    if (linkError) {
      return NextResponse.json(
        { error: "Failed to link repository", details: linkError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      link: {
        id: link.id,
        documentId: link.document_id,
        owner: link.owner,
        repo: link.repo,
        branch: link.branch,
        pathPrefix: link.path_prefix,
        createdAt: link.created_at,
      },
      repository: {
        fullName: repoInfo.full_name,
        private: repoInfo.private,
        defaultBranch: repoInfo.default_branch,
        htmlUrl: repoInfo.html_url,
      },
    });
  } catch (error) {
    if (error instanceof GitHubAPIError) {
      if (error.status === 404) {
        return NextResponse.json(
          {
            error: "Repository not found",
            message: `Could not find ${owner}/${repo}`,
          },
          { status: 404 },
        );
      }
      if (error.status === 401) {
        return NextResponse.json(
          {
            error: "GitHub token expired",
            message: "Please reconnect your GitHub account",
          },
          { status: 401 },
        );
      }
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to verify repository", details: message },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/github/repos
 * Unlink a GitHub repository from a document
 */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse query params
  const searchParams = request.nextUrl.searchParams;
  const documentId = searchParams.get("documentId");

  if (!documentId) {
    return NextResponse.json(
      { error: "Missing required parameter: documentId" },
      { status: 400 },
    );
  }

  // Verify document ownership
  const { data: document, error: docError } = await supabase
    .from("documents")
    .select("id, created_by")
    .eq("id", documentId)
    .single();

  if (docError || !document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (document.created_by !== user.id) {
    return NextResponse.json(
      { error: "You can only unlink repos from your own documents" },
      { status: 403 },
    );
  }

  // Delete the link
  const { error: deleteError } = await supabase
    .from("document_github_repos")
    .delete()
    .eq("document_id", documentId);

  if (deleteError) {
    return NextResponse.json(
      { error: "Failed to unlink repository", details: deleteError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
