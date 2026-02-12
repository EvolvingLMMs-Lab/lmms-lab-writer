"use client";

import { useCallback } from "react";
import type { useTauriDaemon } from "@/lib/tauri";
import type { useRecentProjects } from "@/lib/recent-projects";

interface UseProjectManagementOptions {
  daemon: ReturnType<typeof useTauriDaemon>;
  recentProjects: ReturnType<typeof useRecentProjects>;
  toast: (message: string, type: "success" | "error" | "info") => void;
  onProjectOpen?: () => void;
}

export function useProjectManagement({
  daemon,
  recentProjects,
  toast,
  onProjectOpen,
}: UseProjectManagementOptions) {
  const handleOpenFolder = useCallback(async () => {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select LaTeX Project",
      });

      if (selected && typeof selected === "string") {
        await daemon.setProject(selected);
        await recentProjects.addProject(selected);
        onProjectOpen?.();
      }
    } catch (err) {
      console.error("Failed to open project:", err);
    }
  }, [daemon, recentProjects, onProjectOpen]);

  const handleOpenRecentProject = useCallback(
    async (path: string) => {
      try {
        await daemon.setProject(path);
        await recentProjects.addProject(path);
        onProjectOpen?.();
      } catch (err) {
        console.error("Failed to open project:", err);
        toast("Failed to open project", "error");
        recentProjects.removeProject(path);
      }
    },
    [daemon, recentProjects, toast, onProjectOpen],
  );

  return {
    handleOpenFolder,
    handleOpenRecentProject,
  };
}
