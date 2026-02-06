export type OpenCodeDaemonStatus = "stopped" | "starting" | "running" | "unavailable";

export type PendingEditFileSummary = {
  filePath: string;
  additions: number;
  deletions: number;
};

export type Props = {
  className?: string;
  baseUrl?: string;
  directory?: string;
  autoConnect?: boolean;
  daemonStatus?: OpenCodeDaemonStatus;
  onRestartOpenCode?: () => void;
  onMaxReconnectFailed?: () => void;
  onFileClick?: (path: string) => void;
  pendingMessage?: string | null;
  onPendingMessageSent?: () => void;
  // Callbacks for AI edit accept/reject functionality
  onCaptureFileContent?: (toolPartId: string, filePath: string) => void;
  onEditCompleted?: (toolPartId: string, filePath: string, afterContent: string, messageId?: string) => void;
  onReviewEdit?: (editId: string, filePath: string) => void;
  // Callback when AI turn completes (goes from running/busy to idle)
  onTurnComplete?: () => void;
  // Count of pending edits for the current turn
  pendingEditCount?: number;
  // Pending edit summary grouped by file
  pendingEditSummary?: PendingEditFileSummary[];
  // Callback to open the changes review panel
  onOpenChangesReview?: () => void;
  // Callback to revert all pending edits
  onUndoPendingEdits?: () => void;
};

export type TaskItem = {
  id: string;
  content: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority?: "low" | "medium" | "high";
};

export type AskUserQuestionOption = {
  label: string;
  description?: string;
};

export type AskUserQuestion = {
  question: string;
  header: string;
  options: AskUserQuestionOption[];
  multiSelect?: boolean;
};

export type AttachedFile = { url: string; mime: string; filename: string };
