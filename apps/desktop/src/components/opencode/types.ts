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
