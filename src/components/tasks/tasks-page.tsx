"use client";

import { useState, useEffect, useTransition } from "react";
import { Task, TaskCategory, TaskStatus } from "@/types";
import { TaskCard } from "./task-card";
import { TaskForm } from "./task-form";
import { Plus, Filter, Briefcase, User } from "lucide-react";
import { cn } from "@/lib/utils";

type FilterCategory = TaskCategory | "all";
type FilterStatus = TaskStatus | "active";

export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<FilterCategory>("all");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("active");
  const [isPending, startTransition] = useTransition();

  // Fetch whenever filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filterCategory !== "all") params.set("category", filterCategory);
    if (filterTag) params.set("tag", filterTag);
    if (filterStatus !== "active") params.set("status", filterStatus);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/tasks?${params}`);
        const data: Task[] = await res.json();
        if (filterStatus === "active") {
          setTasks(data.filter((t) => t.status !== "done"));
        } else {
          setTasks(data);
        }
      } catch {
        // ignore fetch errors silently
      }
    });
   
  }, [filterCategory, filterTag, filterStatus]);

  function refetch() {
    const params = new URLSearchParams();
    if (filterCategory !== "all") params.set("category", filterCategory);
    if (filterTag) params.set("tag", filterTag);
    if (filterStatus !== "active") params.set("status", filterStatus);

    startTransition(async () => {
      const res = await fetch(`/api/tasks?${params}`);
      const data: Task[] = await res.json();
      if (filterStatus === "active") {
        setTasks(data.filter((t) => t.status !== "done"));
      } else {
        setTasks(data);
      }
    });
  }

  const allTags = Array.from(new Set(tasks.flatMap((t) => t.tags)));

  function handleStatusChange(id: string, status: Task["status"]) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">タスク</h1>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4" />
            追加
          </button>
        </div>

        {/* Category Filter */}
        <div className="mt-3 flex gap-2">
          {(["all", "private", "work"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setFilterCategory(c)}
              className={cn(
                "flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                filterCategory === c
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
              )}
            >
              {c === "all" && <Filter className="h-3 w-3" />}
              {c === "work" && <Briefcase className="h-3 w-3" />}
              {c === "private" && <User className="h-3 w-3" />}
              {c === "all" ? "すべて" : c === "work" ? "仕事" : "個人"}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="mt-2 flex gap-2">
          {(["active", "todo", "in_progress", "done"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                filterStatus === s
                  ? "bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
              )}
            >
              {{ active: "未完了", todo: "TODO", in_progress: "進行中", done: "完了" }[s]}
            </button>
          ))}
        </div>

        {/* Tag Filter */}
        {allTags.length > 0 && (
          <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-0.5 text-xs transition-colors",
                  filterTag === tag
                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400"
                    : "border text-muted-foreground",
                )}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Task List */}
      <div className={cn("px-4 py-4 space-y-2", isPending && "opacity-60")}>
        {isPending && tasks.length === 0 ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ))}
          </>
        ) : tasks.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            タスクがありません
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} />
          ))
        )}
      </div>

      {showForm && (
        <TaskForm
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}
