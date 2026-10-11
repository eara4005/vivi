"use client";

import { useState } from "react";
import { TaskCategory } from "@/types";
import { X, Briefcase, User } from "lucide-react";

interface TaskFormProps {
  onClose: () => void;
  onCreated: () => void;
}

export function TaskForm({ onClose, onCreated }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TaskCategory>("private");
  const [tagsInput, setTagsInput] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsInput
      .split(/[,\s]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    setLoading(true);
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          category,
          tags,
          dueDate: dueDate || undefined,
        }),
      });
      onCreated();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-t-2xl bg-white dark:bg-gray-900 px-4 pt-4 pb-8">
        {/* Handle */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">タスクを追加</h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="タスクのタイトル"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border bg-transparent px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            autoFocus
          />

          <textarea
            placeholder="詳細（任意）"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-xl border bg-transparent px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />

          {/* Category */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCategory("private")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-colors ${
                category === "private"
                  ? "border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400"
                  : "text-muted-foreground"
              }`}
            >
              <User className="h-4 w-4" />
              個人
            </button>
            <button
              type="button"
              onClick={() => setCategory("work")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-colors ${
                category === "work"
                  ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                  : "text-muted-foreground"
              }`}
            >
              <Briefcase className="h-4 w-4" />
              仕事
            </button>
          </div>

          <input
            type="text"
            placeholder="タグ (カンマ区切り: 買い物, 急ぎ)"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="w-full rounded-xl border bg-transparent px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <div>
            <label className="mb-1 block text-xs text-muted-foreground">期限日（任意）</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border bg-transparent px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={!title.trim() || loading}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? "追加中..." : "タスクを追加"}
          </button>
        </form>
      </div>
    </div>
  );
}
