import { NextResponse } from "next/server";
import { GITHUB_CONFIG } from "@/lib/github/config";

export const revalidate = 3600; // Cache for 1 hour

type RepoInfo = {
  name: string;
  full_name: string;
  description: string | null;
  stargazers_count: number;
  html_url: string;
};

/**
 * GET /api/github/repo-info
 * Fetches public info for all eligible repos (no auth required)
 */
export async function GET() {
  try {
    // Fetch top public repos from org directly (sorted by stars)
    const response = await fetch(
      `https://api.github.com/orgs/${GITHUB_CONFIG.ORG}/repos?per_page=20&sort=stars&direction=desc`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          ...(process.env.GITHUB_TOKEN && {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          }),
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!response.ok) {
      return NextResponse.json({ repos: [] });
    }

    const data = await response.json();

    // Filter public repos and take top 5
    const repos: RepoInfo[] = data
      .filter((repo: { private: boolean }) => !repo.private)
      .slice(0, 5)
      .map((repo: { name: string; full_name: string; description: string | null; stargazers_count: number; html_url: string }) => ({
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        stargazers_count: repo.stargazers_count,
        html_url: repo.html_url,
      }));

    return NextResponse.json({ repos });
  } catch (error) {
    console.error("Error fetching repo info:", error);
    return NextResponse.json(
      { error: "Failed to fetch repository info" },
      { status: 500 }
    );
  }
}
