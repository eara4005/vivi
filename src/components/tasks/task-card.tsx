"use client";

import { useState } from "react";
import { Task } from "@/types";
import { cn } from "@/lib/utils";
import { Check, Circle, Briefcase, User, Tag } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ja } from "date-fns/locale";

interface TaskCardProps {
  task: Task;
  compact?: boolean;
  onStatusChange?: (id: string, status: Task["status"]) => void;
}

export function TaskCard({ task, compact = false, onStatusChange }: TaskCardProps) {
  const [loading, setLoading] = useState(false);

  async function toggleStatus() {
    const next = task.status === "done" ? "todo" : "done";
    setLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, status: next }),
      });
      if (res.ok) onStatusChange?.(task.id, next);
    } finally {
      setLoading(false);
    }
  }

  const isDone = task.status === "done";

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border bg-white dark:bg-gray-900 transition-opacity",
        compact ? "px-3 py-2.5" : "px-4 py-3",
        isDone && "opacity-60",
      )}
    >
      <button
        onClick={toggleStatus}
        disabled={loading}
        className={cn(
          "mt-0.5 shrink-0 rounded-full border-2 p-0.5 transition-colors",
          isDone
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-gray-300 hover:border-indigo-400",
        )}
      >
        {isDone ? <Check className="h-3 w-3" /> : <Circle className="h-3 w-3 text-transparent" />}
      </button>

      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium truncate", isDone && "line-through")}>{task.title}</p>

        {!compact && task.description && (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{task.description}</p>
        )}

        <div className="mt-1 flex flex-wrap items-center gap-2">
          <CategoryBadge category={task.category} />
          {task.dueDate && (
            <span className="text-xs text-muted-foreground">
              {format(parseISO(task.dueDate), "M/d", { locale: ja })}
            </span>
          )}
          {!compact &&
            task.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-0.5 text-xs text-indigo-600 dark:text-indigo-400"
              >
                <Tag className="h-2.5 w-2.5" />
                {tag}
              </span>
            ))}
        </div>
      </div>
    </div>
  );
}

function CategoryBadge({ category }: { category: Task["category"] }) {
  if (category === "work") {
    return (
      <span className="flex items-center gap-0.5 text-xs text-blue-600 dark:text-blue-400">
        <Briefcase className="h-2.5 w-2.5" />
        仕事
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 text-xs text-violet-600 dark:text-violet-400">
      <User className="h-2.5 w-2.5" />
      個人
    </span>
  );
}
