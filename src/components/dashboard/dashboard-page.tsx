"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { CheckSquare, Calendar, MessageCircle, ArrowRight, Sparkles } from "lucide-react";
import { Task } from "@/types";
import { TaskCard } from "@/components/tasks/task-card";

export function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isPending, startTransition] = useTransition();
  // Use lazy initializer to avoid new Date() during prerender
  const [today] = useState(() => format(new Date(), "M月d日(EEE)", { locale: ja }));

  useEffect(() => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/tasks?status=todo");
        const data: Task[] = await res.json();
        setTasks(data.slice(0, 5));
      } catch {
        // ignore
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <header className="px-4 pt-8 pb-6">
        <p className="text-sm text-muted-foreground">{today}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">
          こんにちは、
          <span className="text-indigo-600 dark:text-indigo-400">VIVI</span> です
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">今日も一日がんばりましょう ✨</p>
      </header>

      <div className="px-4 space-y-6">
        {/* Quick Actions */}
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wide">
            クイックアクション
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <QuickActionCard href="/tasks" icon={CheckSquare} label="タスク" color="indigo" />
            <QuickActionCard href="/calendar" icon={Calendar} label="カレンダー" color="emerald" />
            <QuickActionCard href="/chat" icon={MessageCircle} label="チャット" color="violet" />
          </div>
        </section>

        {/* Pending Tasks */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              未完了タスク
            </h2>
            <Link
              href="/tasks"
              className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1"
            >
              すべて見る <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {isPending ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              タスクはありません 🎉
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} compact />
              ))}
            </div>
          )}
        </section>

        {/* Chat CTA */}
        <section>
          <Link
            href="/chat"
            className="flex items-center gap-3 rounded-xl bg-indigo-600 p-4 text-white transition-opacity hover:opacity-90"
          >
            <Sparkles className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-medium text-sm">VIVIに話しかける</p>
              <p className="text-xs text-indigo-200">タスクの整理や相談をAIと一緒に</p>
            </div>
            <ArrowRight className="ml-auto h-5 w-5 shrink-0" />
          </Link>
        </section>
      </div>
    </div>
  );
}

function QuickActionCard({
  href,
  icon: Icon,
  label,
  color,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: "indigo" | "emerald" | "violet";
}) {
  const colorMap = {
    indigo: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    violet: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  };

  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 rounded-xl border bg-white dark:bg-gray-900 p-4 transition-shadow hover:shadow-md"
    >
      <div className={`rounded-lg p-2 ${colorMap[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-xs font-medium">{label}</span>
    </Link>
  );
}
