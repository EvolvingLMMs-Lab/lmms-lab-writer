"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Collaborator = {
  user_id: string;
  role: string;
  created_at: string;
};

type PendingInvite = {
  id: string;
  email: string;
  role: string;
  expires_at: string;
  created_at: string;
};

type Props = {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
};

export function ShareModal({ documentId, isOpen, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  const fetchShareData = useCallback(async () => {
    const res = await fetch(`/api/documents/${documentId}/share`);
    if (res.ok) {
      const data = await res.json();
      setCollaborators(data.collaborators);
      setPendingInvites(data.pendingInvites);
    }
  }, [documentId]);

  useEffect(() => {
    if (!isOpen) return;

    function handleEscapeKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleEscapeKey);
    return () => document.removeEventListener("keydown", handleEscapeKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    previousActiveElement.current = document.activeElement;
    dialogRef.current?.focus();

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
      if (previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen]);

  function handleFocusTrap(e: React.KeyboardEvent) {
    if (e.key !== "Tab" || !dialogRef.current) return;

    const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchShareData();
    }
  }, [isOpen, fetchShareData]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setInviteUrl(null);
    setLoading(true);

    const res = await fetch(`/api/documents/${documentId}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    if (data.type === "direct") {
      setSuccess(`${email} has been added as ${role}`);
    } else {
      setSuccess(`Invite link created for ${email}`);
      setInviteUrl(data.inviteUrl);
    }

    setEmail("");
    fetchShareData();
  }

  async function handleRemove(userId?: string, inviteId?: string) {
    const params = new URLSearchParams();
    if (userId) params.set("userId", userId);
    if (inviteId) params.set("inviteId", inviteId);

    await fetch(`/api/documents/${documentId}/share?${params}`, {
      method: "DELETE",
    });
    fetchShareData();
  }

  function copyInviteUrl() {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl);
      setSuccess("Link copied to clipboard");
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/20 modal-overlay"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
        tabIndex={-1}
        onKeyDown={handleFocusTrap}
        className="relative bg-white border border-black w-full max-w-lg mx-4 outline-none modal-content"
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 id="share-modal-title" className="text-lg font-medium">
            Share document
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-muted hover:text-black transition-colors"
          >
            <svg
              className="w-5 h-5"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
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

        <div className="p-4">
          <form onSubmit={handleInvite} className="flex gap-2 mb-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="flex-1 p-2 border border-border focus:border-black focus:outline-none text-sm"
              required
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "editor" | "viewer")}
              className="p-2 border border-border focus:border-black focus:outline-none text-sm bg-white"
            >
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-sm btn-primary"
            >
              {loading ? "..." : "Invite"}
            </button>
          </form>

          {error && (
            <div className="p-2 mb-4 border border-black text-black text-sm font-medium">
              Error: {error}
            </div>
          )}

          {success && (
            <div className="p-2 mb-4 border border-black text-black text-sm bg-accent-hover">
              {success}
            </div>
          )}

          {inviteUrl && (
            <div className="p-2 mb-4 border border-border">
              <p className="text-xs text-muted mb-2">Share this link:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inviteUrl}
                  readOnly
                  className="flex-1 p-2 text-xs bg-neutral-50 border border-border"
                />
                <button
                  onClick={copyInviteUrl}
                  className="btn btn-sm btn-secondary"
                >
                  Copy
                </button>
              </div>
            </div>
          )}

          {(collaborators.length > 0 || pendingInvites.length > 0) && (
            <div className="border border-border divide-y divide-border">
              {collaborators.map((c) => (
                <div
                  key={c.user_id}
                  className="flex items-center justify-between p-3"
                >
                  <div>
                    <span className="text-sm">{c.user_id}</span>
                    <span className="ml-2 text-xs text-muted uppercase">
                      {c.role}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemove(c.user_id)}
                    className="text-xs text-muted hover:text-black hover:font-bold transition-all"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-3 bg-neutral-50"
                >
                  <div>
                    <span className="text-sm">{invite.email}</span>
                    <span className="ml-2 text-xs text-muted uppercase">
                      {invite.role}
                    </span>
                    <span className="ml-2 text-xs text-muted">(pending)</span>
                  </div>
                  <button
                    onClick={() => handleRemove(undefined, invite.id)}
                    className="text-xs text-muted hover:text-black hover:font-bold transition-all"
                  >
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
