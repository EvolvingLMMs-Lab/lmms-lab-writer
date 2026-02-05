"use client";

import { useState, useMemo } from "react";
import type { ToolPart } from "@/lib/opencode/types";
import { getToolInfo } from "@/lib/opencode/types";
import { Spinner } from "@/components/ui/spinner";
import { ChevronIcon, ToolIcon } from "./icons";
import { TasksDisplay, parseTasks } from "./tasks-display";
import { formatValue } from "./utils";

export function ToolDisplay({
  part,
  onFileClick,
  onReviewEdit,
}: {
  part: ToolPart;
  onFileClick?: (path: string) => void;
  onReviewEdit?: (editId: string, filePath: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const info = getToolInfo(part.tool, part.state.input);
  const isRunning = part.state.status === "running";
  const isError = part.state.status === "error";

  const isClickableFile =
    onFileClick &&
    info.subtitle &&
    /\.(tex|bib|cls|sty|txt|md|json|yaml|yml|py|js|ts|tsx|css|html|pdf|log|aux|gz|xdv|fdb_latexmk|synctex)$/i.test(
      info.subtitle,
    );
  const output = (part.state as { output?: string }).output;
  // Always expand if it's a task tool to show the UI
  const isTaskTool = ['todowrite', 'todocreate', 'todolist', 'todoread', 'todoupdate'].includes(part.tool.toLowerCase());

  // Try to parse tasks from input or output
  const tasksFromInput = isTaskTool ? parseTasks(part.state.input) : null;
  // Output might be a stringified JSON
  const tasksFromOutput = useMemo(() => {
    if (!isTaskTool || !output) return null;
    try {
      const parsed = JSON.parse(output);
      return parseTasks(parsed);
    } catch {
      return null;
    }
  }, [isTaskTool, output]);

  const tasksToDisplay = tasksFromOutput || tasksFromInput;

  // If we have tasks to display, force "hasDetails" to true to allow expansion (or auto-expand)
  const hasDetails = Object.keys(part.state.input).length > 0 || output || tasksToDisplay;

  const diffStats = useMemo(() => {
    if (output && (part.tool === "write" || part.tool === "edit")) {
      const addMatch = output.match(/\+(\d+)/);
      const delMatch = output.match(/-(\d+)/);
      return {
        added: addMatch?.[1] ? parseInt(addMatch[1], 10) : null,
        deleted: delMatch?.[1] ? parseInt(delMatch[1], 10) : null,
      };
    }
    return null;
  }, [output, part.tool]);

  const isFileEditTool =
    (part.tool === "write" || part.tool === "edit") &&
    part.state.status === "completed";

  return (
    <div
      className={`text-[13px] bg-neutral-50 hover:bg-neutral-100 transition-colors ${isError ? "bg-red-50" : ""}`}
    >
      <div
        role="button"
        tabIndex={hasDetails ? 0 : undefined}
        onClick={() => hasDetails && setExpanded(!expanded)}
        onKeyDown={(e) => {
          if (hasDetails && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            setExpanded(!expanded);
          }
        }}
        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left ${hasDetails ? "cursor-pointer" : "cursor-default"}`}
      >
        {isRunning ? (
          <Spinner className="size-4 flex-shrink-0" />
        ) : (
          <ToolIcon tool={part.tool} />
        )}
        {isClickableFile ? (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onFileClick!(info.subtitle!);
            }}
            className="text-neutral-800 hover:text-black hover:underline truncate cursor-pointer flex-1"
          >
            {info.subtitle || info.title}
          </span>
        ) : (
          <span className="text-neutral-800 truncate flex-1">
            {info.subtitle || info.title}
          </span>
        )}
        {diffStats && (diffStats.added || diffStats.deleted) && (
          <span className="flex items-center gap-1 text-xs flex-shrink-0">
            {diffStats.added && (
              <span className="text-green-600">+{diffStats.added}</span>
            )}
            {diffStats.deleted && (
              <span className="text-red-500">-{diffStats.deleted}</span>
            )}
          </span>
        )}
        {onReviewEdit && isFileEditTool && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const filePath =
                (part.state.input.filePath as string) ||
                (part.state.input.file_path as string) ||
                "";
              onReviewEdit(part.id, filePath);
            }}
            className="text-[10px] font-mono px-2 py-0.5 border border-neutral-300 text-neutral-600 hover:border-black hover:text-black hover:bg-neutral-100 transition-colors flex-shrink-0"
          >
            Review
          </button>
        )}
        {hasDetails && (
          <ChevronIcon
            className={`size-4 text-neutral-400 flex-shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        )}
      </div>

      {expanded && (
        <div className="border-t border-neutral-200 bg-white">
          {/* Special Task Display */}
          {tasksToDisplay && (
            <div className="px-3 py-2">
              <TasksDisplay tasks={tasksToDisplay} />
            </div>
          )}

          {/* Standard Input/Output fallback if no special display or if debugging */}
          {(!tasksToDisplay && Object.keys(part.state.input).length > 0) && (
            <div className="px-3 py-2 space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium">
                Input
              </div>
              {Object.entries(part.state.input).map(([key, value]) => (
                <div key={key} className="font-mono text-xs">
                  <span className="text-accent font-medium">{key}</span>
                  <span className="text-neutral-400">: </span>
                  <span className="text-neutral-700 whitespace-pre-wrap break-all">
                    {formatValue(value)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {(!tasksToDisplay && output) && (
            <div className="px-3 py-2 border-t border-neutral-200">
              <div className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium mb-1">
                Output
              </div>
              <pre className="text-xs text-neutral-600 whitespace-pre-wrap break-all font-mono max-h-48 overflow-auto">
                {output.length > 2000 ? output.slice(0, 2000) + "..." : output}
              </pre>
            </div>
          )}
        </div>
      )}

      {isError && (
        <div className="border-t border-red-200 px-3 py-2 bg-red-50">
          <p className="text-xs text-red-600">
            {(part.state as { error: string }).error}
          </p>
        </div>
      )}
    </div>
  );
}
