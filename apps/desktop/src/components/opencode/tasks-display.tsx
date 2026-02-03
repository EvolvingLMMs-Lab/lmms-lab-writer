"use client";

import { useState, useMemo } from "react";
import { CheckIcon, DisclosureTriangle } from "./icons";
import { Spinner } from "@/components/ui/spinner";
import type { TaskItem } from "./types";

export function parseTasks(data: unknown): TaskItem[] | null {
  if (!data) return null;

  if (Array.isArray(data)) {
    return data.every(item => typeof item === 'object' && item?.content)
      ? data as TaskItem[]
      : null;
  }

  if (typeof data === 'object' && data !== null && 'todos' in data) {
    const todos = (data as { todos: unknown }).todos;
    if (Array.isArray(todos)) {
      return todos.every(item => typeof item === 'object' && item?.content)
        ? todos as TaskItem[]
        : null;
    }
  }

  return null;
}

export function CollapsibleTasksBar({ tasks }: { tasks: TaskItem[] }) {
  const [expanded, setExpanded] = useState(false);

  const { completed, inProgress, total } = useMemo(() => {
    let comp = 0;
    let prog = 0;
    for (const t of tasks) {
      if (t.status === "completed") comp++;
      else if (t.status === "in_progress") prog++;
    }
    return { completed: comp, inProgress: prog, total: tasks.length };
  }, [tasks]);

  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="border-b border-border bg-white">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-neutral-50 transition-colors"
      >
        <DisclosureTriangle open={expanded} />
        <span className="text-[10px] font-mono font-medium text-muted uppercase tracking-wider">
          Tasks
        </span>
        <span className="text-[10px] font-mono text-muted">
          {completed}/{total}
        </span>
        {/* Progress bar */}
        <div className="flex-1 h-1 bg-neutral-100 rounded-full overflow-hidden mx-1">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
        {inProgress > 0 && (
          <Spinner className="size-3 flex-shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-border divide-y divide-border max-h-48 overflow-y-auto">
          {tasks.map((task) => (
            <div key={task.id} className="px-3 py-1.5 flex items-start gap-2 hover:bg-neutral-50 transition-colors">
              <div className={`size-3.5 flex-shrink-0 mt-0.5 border flex items-center justify-center ${
                task.status === 'completed'
                  ? 'border-accent bg-accent'
                  : task.status === 'in_progress'
                    ? 'border-accent'
                    : task.status === 'cancelled'
                      ? 'border-neutral-300 bg-neutral-100'
                      : 'border-neutral-300'
              }`}>
                {task.status === 'completed' && <CheckIcon className="size-2.5 text-white" />}
                {task.status === 'in_progress' && <Spinner className="size-2" />}
                {task.status === 'cancelled' && <span className="text-[9px] text-neutral-400">&times;</span>}
              </div>
              <span className={`text-[11px] leading-tight ${
                task.status === 'completed' || task.status === 'cancelled'
                  ? 'text-muted line-through'
                  : ''
              }`}>
                {task.content}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function TasksDisplay({ tasks }: { tasks: TaskItem[] }) {
  return (
    <div className="border-2 border-border bg-white my-2 overflow-hidden">
      <div className="bg-neutral-50 px-3 py-1.5 border-b border-border flex justify-between items-center">
        <span className="text-[10px] font-mono font-medium text-muted uppercase tracking-wider">Tasks</span>
        <span className="text-[10px] font-mono text-muted">{tasks.length}</span>
      </div>
      <div className="divide-y divide-border">
        {tasks.map((task) => (
          <div key={task.id} className="px-3 py-2 flex items-start gap-2 hover:bg-neutral-50 transition-colors">
            <div className={`size-4 flex-shrink-0 mt-0.5 border flex items-center justify-center ${
              task.status === 'completed'
                ? 'border-accent bg-accent'
                : task.status === 'in_progress'
                  ? 'border-accent'
                  : task.status === 'cancelled'
                    ? 'border-neutral-300 bg-neutral-100'
                    : 'border-neutral-300'
            }`}>
              {task.status === 'completed' && <CheckIcon className="size-3 text-white" />}
              {task.status === 'in_progress' && <Spinner className="size-2.5" />}
              {task.status === 'cancelled' && <span className="text-[10px] text-neutral-400">&times;</span>}
            </div>

            <div className="flex-1 min-w-0">
              <div className={`text-xs ${
                task.status === 'completed' || task.status === 'cancelled'
                  ? 'text-muted line-through'
                  : ''
              }`}>
                {task.content}
              </div>
              {task.priority && (
                <span className={`text-[9px] font-mono uppercase tracking-wider mt-1 inline-block ${
                  task.priority === 'high' ? 'text-accent font-bold' : 'text-muted'
                }`}>
                  {task.priority}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
