import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { getStoredGitHubToken } from "@/lib/github/stars";
import { getCommitHistory, GitHubAPIError } from "@/lib/github/git-api";

interface RouteParams {
  params: Promise<{
    owner: string;
    repo: string;
  }>;
}

/**
 * GET /api/github/repos/[owner]/[repo]/commits
 * Get commit history for a linked repository
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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

  const { owner, repo } = await params;

  // Parse query params
  const searchParams = request.nextUrl.searchParams;
  const path = searchParams.get("path") || undefined;
  const sha = searchParams.get("sha") || undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") || "30", 10), 100);
  const page = parseInt(searchParams.get("page") || "1", 10);

  // Optional: verify this repo is linked to one of user's documents
  const documentId = searchParams.get("documentId");
  if (documentId) {
    const { data: link, error: linkError } = await supabase
      .from("document_github_repos")
      .select("id, document_id")
      .eq("document_id", documentId)
      .eq("owner", owner)
      .eq("repo", repo)
      .single();

    if (linkError || !link) {
      return NextResponse.json(
        {
          error: "Repository not linked",
          message: `${owner}/${repo} is not linked to this document`,
        },
        { status: 400 },
      );
    }

    // Verify document ownership
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("id, created_by")
      .eq("id", documentId)
      .single();

    if (docError || !document || document.created_by !== user.id) {
      return NextResponse.json(
        { error: "Document not found or access denied" },
        { status: 403 },
      );
    }
  }

  try {
    const { commits, rateLimit } = await getCommitHistory(
      tokenInfo.accessToken,
      owner,
      repo,
      path,
      { limit, sha, page },
    );

    return NextResponse.json({
      commits: commits.map((commit) => ({
        sha: commit.sha,
        shortSha: commit.sha.slice(0, 7),
        message: commit.commit.message,
        author: {
          name: commit.commit.author.name,
          email: commit.commit.author.email,
          date: commit.commit.author.date,
          login: commit.author?.login || null,
          avatarUrl: commit.author?.avatar_url || null,
        },
        committer: {
          name: commit.commit.committer.name,
          email: commit.commit.committer.email,
          date: commit.commit.committer.date,
          login: commit.committer?.login || null,
          avatarUrl: commit.committer?.avatar_url || null,
        },
        htmlUrl: commit.html_url,
        parents: commit.parents.map((p: { sha: string }) => p.sha),
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
        limit,
        hasMore: commits.length === limit,
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
      if (error.status === 404) {
        return NextResponse.json(
          {
            error: "Repository not found",
            message: `Could not find ${owner}/${repo}`,
          },
          { status: 404 },
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
      { error: "Failed to fetch commits", details: message },
      { status: 500 },
    );
  }
}
