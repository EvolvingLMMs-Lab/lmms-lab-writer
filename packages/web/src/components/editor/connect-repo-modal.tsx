"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  listUserRepos,
  listBranches,
  GitHubRepo,
  GitHubBranch,
} from "@/lib/github/git-api";
import { GitConnection } from "@/hooks/use-git-sync";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (owner: string, repo: string, branch: string) => Promise<void>;
  onDisconnect: () => void;
  currentConnection: GitConnection | null;
};

export function ConnectRepoModal({
  isOpen,
  onClose,
  onConnect,
  onDisconnect,
  currentConnection,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"repos" | "branches">("repos");

  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus trap and escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Fetch repos on open
  useEffect(() => {
    if (isOpen && !currentConnection) {
      loadRepos();
    }
  }, [isOpen, currentConnection]);

  async function getToken() {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.provider_token;
  }

  async function loadRepos() {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) {
        setError("Please sign in with GitHub to connect a repository.");
        setLoading(false);
        return;
      }
      const { repos } = await listUserRepos(token, { perPage: 100 });
      setRepos(repos);
    } catch (e: any) {
      setError(e.message || "Failed to load repositories");
    } finally {
      setLoading(false);
    }
  }

  async function handleRepoSelect(repo: GitHubRepo) {
    setSelectedRepo(repo);
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("No token");

      const owner = repo.full_name.split("/")[0];
      const { branches } = await listBranches(token, owner, repo.name);
      setBranches(branches);
      setSelectedBranch(repo.default_branch);
      setStep("branches");
    } catch (e: any) {
      setError(e.message || "Failed to load branches");
      setSelectedRepo(null); // Reset on error
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect() {
    if (!selectedRepo || !selectedBranch) return;
    setLoading(true);
    try {
      const owner = selectedRepo.full_name.split("/")[0];
      await onConnect(owner, selectedRepo.name, selectedBranch);
      onClose();
    } catch (e: any) {
      setError(e.message || "Failed to connect");
    } finally {
      setLoading(false);
    }
  }

  const filteredRepos = repos.filter((repo) =>
    repo.full_name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/20"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        className="relative bg-white border border-black w-full max-w-lg mx-4 flex flex-col max-h-[85vh] shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-medium">Connect Repository</h2>
          <button onClick={onClose} className="text-muted hover:text-black">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="square"
                strokeLinejoin="miter"
                strokeWidth={1.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 border border-black text-sm bg-neutral-50">
              {error}
            </div>
          )}

          {currentConnection ? (
            <div className="space-y-4">
              <div className="p-4 border border-border bg-neutral-50">
                <div className="text-sm text-muted mb-1">Connected to</div>
                <div className="font-mono text-lg">
                  {currentConnection.owner}/{currentConnection.repo}
                </div>
                <div className="text-sm mt-2 flex items-center gap-2">
                  <span className="text-muted">Branch:</span>
                  <span className="font-mono bg-white border border-border px-2 py-0.5">
                    {currentConnection.branch}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  onDisconnect();
                  setStep("repos");
                  setSelectedRepo(null);
                  setSelectedBranch("");
                }}
                className="w-full py-2 border border-black hover:bg-neutral-100 transition-colors text-sm uppercase tracking-wider"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {step === "repos" && (
                <>
                  <input
                    type="text"
                    placeholder="Search repositories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full p-2 border border-border focus:border-black focus:outline-none text-sm"
                    autoFocus
                  />

                  <div className="border border-border h-64 overflow-y-auto">
                    {loading ? (
                      <div className="h-full flex items-center justify-center text-muted text-sm">
                        Loading...
                      </div>
                    ) : filteredRepos.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-muted text-sm">
                        No repositories found
                      </div>
                    ) : (
                      <ul className="divide-y divide-border">
                        {filteredRepos.map((repo) => (
                          <li key={repo.id}>
                            <button
                              onClick={() => handleRepoSelect(repo)}
                              className="w-full text-left p-3 hover:bg-neutral-100 transition-colors focus:bg-neutral-100 focus:outline-none"
                            >
                              <div className="font-medium text-sm">
                                {repo.full_name}
                              </div>
                              <div className="text-xs text-muted flex items-center gap-2 mt-1">
                                <span>
                                  {new Date(
                                    repo.updated_at,
                                  ).toLocaleDateString()}
                                </span>
                                {repo.private && (
                                  <span className="border border-border px-1 text-[10px] uppercase">
                                    Private
                                  </span>
                                )}
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}

              {step === "branches" && selectedRepo && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm pb-2 border-b border-border">
                    <button
                      onClick={() => setStep("repos")}
                      className="text-muted hover:text-black"
                    >
                      Repositories
                    </button>
                    <span className="text-muted">/</span>
                    <span className="font-medium">
                      {selectedRepo.full_name}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-muted mb-2">
                      Select Branch
                    </label>
                    <select
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                      className="w-full p-2 border border-border bg-white focus:border-black focus:outline-none"
                    >
                      {branches.map((branch) => (
                        <option key={branch.name} value={branch.name}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-4 flex gap-2">
                    <button
                      onClick={() => setStep("repos")}
                      className="flex-1 py-2 border border-transparent hover:bg-neutral-100 text-sm"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleConnect}
                      disabled={loading}
                      className="flex-1 py-2 bg-black text-white hover:bg-black/90 disabled:opacity-50 text-sm uppercase tracking-wider shadow-[2px_2px_0_0_rgba(0,0,0,0.2)]"
                    >
                      {loading ? "Connecting..." : "Connect"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
