import { CheckIcon } from "./icons";
import { Spinner } from "@/components/ui/spinner";
import type { TaskItem } from "./types";

export function parseTasks(data: unknown): TaskItem[] | null {
  if (!data) return null;

  // Handle direct array
  if (Array.isArray(data)) {
    return data.every(item => typeof item === 'object' && item?.content)
      ? data as TaskItem[]
      : null;
  }

  // Handle object with 'todos' property (common in OpenCode)
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
            {/* Status indicator */}
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
