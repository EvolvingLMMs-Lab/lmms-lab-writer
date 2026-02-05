"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "recent-projects";
const MAX_PROJECTS = 10;

export type RecentProject = {
  path: string;
  name: string;
  lastOpened: number;
};

function getProjectName(path: string): string {
  const normalized = path.replace(/\\/g, "/");
  const parts = normalized.split("/").filter(Boolean);
  return parts[parts.length - 1] || path;
}

export function useRecentProjects() {
  const [projects, setProjects] = useState<RecentProject[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as RecentProject[];
        setProjects(parsed.sort((a, b) => b.lastOpened - a.lastOpened));
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  const saveProjects = useCallback((newProjects: RecentProject[]) => {
    const sorted = newProjects.sort((a, b) => b.lastOpened - a.lastOpened);
    setProjects(sorted);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
  }, []);

  const addProject = useCallback(
    (path: string) => {
      const normalized = path.replace(/\\/g, "/");
      const existing = projects.filter((p) => p.path !== normalized);
      const newProject: RecentProject = {
        path: normalized,
        name: getProjectName(normalized),
        lastOpened: Date.now(),
      };
      const updated = [newProject, ...existing].slice(0, MAX_PROJECTS);
      saveProjects(updated);
    },
    [projects, saveProjects]
  );

  const removeProject = useCallback(
    (path: string) => {
      const updated = projects.filter((p) => p.path !== path);
      saveProjects(updated);
    },
    [projects, saveProjects]
  );

  const clearAll = useCallback(() => {
    setProjects([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { projects, addProject, removeProject, clearAll };
}
