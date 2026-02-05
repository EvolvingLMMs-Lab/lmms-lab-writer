export type OpenCodeDaemonStatus = "stopped" | "starting" | "running" | "unavailable";

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
  onEditCompleted?: (toolPartId: string, filePath: string, afterContent: string) => void;
  onReviewEdit?: (editId: string, filePath: string) => void;
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
