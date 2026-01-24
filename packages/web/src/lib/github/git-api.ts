/**
 * GitHub REST API client for Git operations
 * Uses fetch directly - no Octokit dependency
 */

const GITHUB_API_BASE = "https://api.github.com";

// ============================================================================
// Types
// ============================================================================

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description: string | null;
  html_url: string;
  default_branch: string;
  updated_at: string;
  pushed_at: string;
  permissions?: {
    admin: boolean;
    push: boolean;
    pull: boolean;
  };
}

export interface GitHubContent {
  type: "file" | "dir" | "symlink" | "submodule";
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  download_url: string | null;
  content?: string; // Base64 encoded for files
  encoding?: string;
}

export interface GitHubCommit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  committer: {
    name: string;
    email: string;
    date: string;
  };
  html_url: string;
  parents: Array<{ sha: string; url: string }>;
}

export interface GitHubCommitResponse {
  sha: string;
  node_id: string;
  url: string;
  html_url: string;
  commit: GitHubCommit;
  author: {
    login: string;
    avatar_url: string;
  } | null;
  committer: {
    login: string;
    avatar_url: string;
  } | null;
  parents: Array<{ sha: string; url: string }>;
}

export interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

export interface GitHubRef {
  ref: string;
  node_id: string;
  url: string;
  object: {
    type: string;
    sha: string;
    url: string;
  };
}

export interface FileCreateResponse {
  content: GitHubContent;
  commit: {
    sha: string;
    message: string;
    html_url: string;
  };
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  used: number;
}

export class GitHubAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public rateLimit?: RateLimitInfo,
  ) {
    super(message);
    this.name = "GitHubAPIError";
  }
}

// ============================================================================
// Internal helpers
// ============================================================================

function extractRateLimit(headers: Headers): RateLimitInfo | undefined {
  const limit = headers.get("X-RateLimit-Limit");
  const remaining = headers.get("X-RateLimit-Remaining");
  const reset = headers.get("X-RateLimit-Reset");
  const used = headers.get("X-RateLimit-Used");

  if (limit && remaining && reset) {
    return {
      limit: parseInt(limit, 10),
      remaining: parseInt(remaining, 10),
      reset: parseInt(reset, 10),
      used: used ? parseInt(used, 10) : 0,
    };
  }
  return undefined;
}

async function githubFetch<T>(
  accessToken: string,
  endpoint: string,
  options: RequestInit = {},
): Promise<{ data: T; rateLimit?: RateLimitInfo }> {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${GITHUB_API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const rateLimit = extractRateLimit(response.headers);

  // Check rate limit before processing response
  if (rateLimit && rateLimit.remaining === 0) {
    const resetDate = new Date(rateLimit.reset * 1000);
    throw new GitHubAPIError(
      `GitHub API rate limit exceeded. Resets at ${resetDate.toISOString()}`,
      429,
      rateLimit,
    );
  }

  if (!response.ok) {
    let errorMessage = `GitHub API error: ${response.status} ${response.statusText}`;
    try {
      const errorBody = await response.json();
      if (errorBody.message) {
        errorMessage = errorBody.message;
      }
    } catch {
      // Ignore JSON parse errors
    }
    throw new GitHubAPIError(errorMessage, response.status, rateLimit);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return { data: null as T, rateLimit };
  }

  const data = await response.json();
  return { data, rateLimit };
}

// ============================================================================
// Public API
// ============================================================================

/**
 * List repositories accessible to the authenticated user
 * Returns repos with push access, sorted by most recently pushed
 */
export async function listUserRepos(
  accessToken: string,
  options: {
    perPage?: number;
    page?: number;
    type?: "all" | "owner" | "member";
  } = {},
): Promise<{ repos: GitHubRepo[]; rateLimit?: RateLimitInfo }> {
  const { perPage = 30, page = 1, type = "all" } = options;

  const { data, rateLimit } = await githubFetch<GitHubRepo[]>(
    accessToken,
    `/user/repos?type=${type}&sort=pushed&direction=desc&per_page=${perPage}&page=${page}`,
  );

  // Filter to repos where user has push access
  const pushableRepos = data.filter((repo) => repo.permissions?.push);

  return { repos: pushableRepos, rateLimit };
}

/**
 * Get contents of a file or directory in a repository
 */
export async function getRepoContents(
  accessToken: string,
  owner: string,
  repo: string,
  path: string = "",
  ref?: string,
): Promise<{
  contents: GitHubContent | GitHubContent[];
  rateLimit?: RateLimitInfo;
}> {
  let endpoint = `/repos/${owner}/${repo}/contents/${path}`;
  if (ref) {
    endpoint += `?ref=${encodeURIComponent(ref)}`;
  }

  const { data, rateLimit } = await githubFetch<
    GitHubContent | GitHubContent[]
  >(accessToken, endpoint);

  return { contents: data, rateLimit };
}

/**
 * Get decoded file content
 */
export async function getFileContent(
  accessToken: string,
  owner: string,
  repo: string,
  path: string,
  ref?: string,
): Promise<{ content: string; sha: string; rateLimit?: RateLimitInfo }> {
  const { contents, rateLimit } = await getRepoContents(
    accessToken,
    owner,
    repo,
    path,
    ref,
  );

  if (Array.isArray(contents)) {
    throw new GitHubAPIError("Path is a directory, not a file", 400);
  }

  if (contents.type !== "file" || !contents.content) {
    throw new GitHubAPIError("Path is not a file or has no content", 400);
  }

  // Decode base64 content
  const decoded = Buffer.from(contents.content, "base64").toString("utf-8");

  return { content: decoded, sha: contents.sha, rateLimit };
}

/**
 * Create or update a file in a repository
 */
export async function createOrUpdateFile(
  accessToken: string,
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  sha?: string,
  branch?: string,
): Promise<{ response: FileCreateResponse; rateLimit?: RateLimitInfo }> {
  const body: Record<string, string> = {
    message,
    content: Buffer.from(content).toString("base64"),
  };

  if (sha) {
    body.sha = sha;
  }

  if (branch) {
    body.branch = branch;
  }

  const { data, rateLimit } = await githubFetch<FileCreateResponse>(
    accessToken,
    `/repos/${owner}/${repo}/contents/${path}`,
    {
      method: "PUT",
      body: JSON.stringify(body),
    },
  );

  return { response: data, rateLimit };
}

/**
 * Delete a file from a repository
 */
export async function deleteFile(
  accessToken: string,
  owner: string,
  repo: string,
  path: string,
  message: string,
  sha: string,
  branch?: string,
): Promise<{ rateLimit?: RateLimitInfo }> {
  const body: Record<string, string> = {
    message,
    sha,
  };

  if (branch) {
    body.branch = branch;
  }

  const { rateLimit } = await githubFetch<{ commit: { sha: string } }>(
    accessToken,
    `/repos/${owner}/${repo}/contents/${path}`,
    {
      method: "DELETE",
      body: JSON.stringify(body),
    },
  );

  return { rateLimit };
}

/**
 * Get commit history for a repository or specific file
 */
export async function getCommitHistory(
  accessToken: string,
  owner: string,
  repo: string,
  path?: string,
  options: { limit?: number; sha?: string; page?: number } = {},
): Promise<{ commits: GitHubCommitResponse[]; rateLimit?: RateLimitInfo }> {
  const { limit = 30, sha, page = 1 } = options;

  const params = new URLSearchParams({
    per_page: String(limit),
    page: String(page),
  });

  if (path) {
    params.set("path", path);
  }

  if (sha) {
    params.set("sha", sha);
  }

  const { data, rateLimit } = await githubFetch<GitHubCommitResponse[]>(
    accessToken,
    `/repos/${owner}/${repo}/commits?${params.toString()}`,
  );

  return { commits: data, rateLimit };
}

/**
 * Get a specific commit
 */
export async function getCommit(
  accessToken: string,
  owner: string,
  repo: string,
  ref: string,
): Promise<{ commit: GitHubCommitResponse; rateLimit?: RateLimitInfo }> {
  const { data, rateLimit } = await githubFetch<GitHubCommitResponse>(
    accessToken,
    `/repos/${owner}/${repo}/commits/${ref}`,
  );

  return { commit: data, rateLimit };
}

/**
 * List branches in a repository
 */
export async function listBranches(
  accessToken: string,
  owner: string,
  repo: string,
  options: { perPage?: number; page?: number } = {},
): Promise<{ branches: GitHubBranch[]; rateLimit?: RateLimitInfo }> {
  const { perPage = 30, page = 1 } = options;

  const { data, rateLimit } = await githubFetch<GitHubBranch[]>(
    accessToken,
    `/repos/${owner}/${repo}/branches?per_page=${perPage}&page=${page}`,
  );

  return { branches: data, rateLimit };
}

/**
 * Create a new branch from a reference (branch name or SHA)
 */
export async function createBranch(
  accessToken: string,
  owner: string,
  repo: string,
  branchName: string,
  fromRef: string,
): Promise<{ ref: GitHubRef; rateLimit?: RateLimitInfo }> {
  // First, get the SHA of the reference
  let sha = fromRef;

  // If fromRef doesn't look like a SHA (40 hex chars), resolve it
  if (!/^[0-9a-f]{40}$/i.test(fromRef)) {
    const { data } = await githubFetch<GitHubRef>(
      accessToken,
      `/repos/${owner}/${repo}/git/ref/heads/${fromRef}`,
    );
    sha = data.object.sha;
  }

  // Create the new branch
  const { data, rateLimit } = await githubFetch<GitHubRef>(
    accessToken,
    `/repos/${owner}/${repo}/git/refs`,
    {
      method: "POST",
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha,
      }),
    },
  );

  return { ref: data, rateLimit };
}

/**
 * Delete a branch
 */
export async function deleteBranch(
  accessToken: string,
  owner: string,
  repo: string,
  branchName: string,
): Promise<{ rateLimit?: RateLimitInfo }> {
  const { rateLimit } = await githubFetch<null>(
    accessToken,
    `/repos/${owner}/${repo}/git/refs/heads/${branchName}`,
    { method: "DELETE" },
  );

  return { rateLimit };
}

/**
 * Get repository information
 */
export async function getRepo(
  accessToken: string,
  owner: string,
  repo: string,
): Promise<{ repo: GitHubRepo; rateLimit?: RateLimitInfo }> {
  const { data, rateLimit } = await githubFetch<GitHubRepo>(
    accessToken,
    `/repos/${owner}/${repo}`,
  );

  return { repo: data, rateLimit };
}

/**
 * Compare two commits/branches/tags
 */
export async function compareCommits(
  accessToken: string,
  owner: string,
  repo: string,
  base: string,
  head: string,
): Promise<{
  comparison: {
    status: "ahead" | "behind" | "diverged" | "identical";
    ahead_by: number;
    behind_by: number;
    total_commits: number;
    commits: GitHubCommitResponse[];
  };
  rateLimit?: RateLimitInfo;
}> {
  const { data, rateLimit } = await githubFetch<{
    status: "ahead" | "behind" | "diverged" | "identical";
    ahead_by: number;
    behind_by: number;
    total_commits: number;
    commits: GitHubCommitResponse[];
  }>(accessToken, `/repos/${owner}/${repo}/compare/${base}...${head}`);

  return { comparison: data, rateLimit };
}
