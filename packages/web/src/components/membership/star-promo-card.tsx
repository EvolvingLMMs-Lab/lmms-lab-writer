"use client";

import { GITHUB_CONFIG, StarredRepo } from "@/lib/github/config";

interface StarPromoCardProps {
  starredRepos: StarredRepo[];
}

export function StarPromoCard({ starredRepos }: StarPromoCardProps) {
  const starredRepoNames = new Set(starredRepos.map((r) => r.repo));

  return (
    <div className="border border-black p-6 space-y-6">
      <div className="space-y-1">
        <h3 className="font-mono text-lg font-bold uppercase tracking-wider">
          Earn Membership
        </h3>
        <p className="text-sm text-neutral-600">
          Star our repositories to unlock Member tier features. Each star grants
          +7 days.
        </p>
      </div>

      <div className="grid gap-3">
        {GITHUB_CONFIG.ELIGIBLE_REPOS.map((repoName) => {
          const isStarred = starredRepoNames.has(repoName);
          const repoUrl = `https://github.com/${GITHUB_CONFIG.ORG}/${repoName}`;

          return (
            <div
              key={repoName}
              className="flex items-center justify-between p-4 border border-neutral-200 hover:border-black transition-colors group"
            >
              <div className="flex flex-col">
                <a
                  href={repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono font-medium hover:underline flex items-center gap-2"
                >
                  {GITHUB_CONFIG.ORG}/{repoName}
                  <svg
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-400"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                </a>
              </div>

              {isStarred ? (
                <div className="flex items-center gap-2 bg-neutral-100 text-black px-3 py-1 border border-neutral-200">
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span className="text-xs font-mono uppercase tracking-widest font-bold">
                    Starred
                  </span>
                </div>
              ) : (
                <a
                  href={repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1 bg-black text-white hover:bg-neutral-800 transition-colors text-xs font-mono uppercase tracking-widest border border-black"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                  Star (+7 Days)
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
