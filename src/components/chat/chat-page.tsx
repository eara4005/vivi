"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessage, ExtractedTask } from "@/types";
import { Send, Sparkles, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PendingTask extends ExtractedTask {
  confirmed?: boolean;
}

export function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || isStreaming) return;

    setInput("");

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);

    // Start streaming response
    const assistantId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "", createdAt: new Date().toISOString() },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: text }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = JSON.parse(line.slice(6));

          if (data.chunk) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: m.content + data.chunk } : m,
              ),
            );
          } else if (data.done) {
            if (data.sessionId) setSessionId(data.sessionId);
          } else if (data.error) {
            console.error("Chat error:", data.error);
          }
        }
      }

      // Try extracting tasks from user message
      extractTasks(text);
    } finally {
      setIsStreaming(false);
    }
  }

  async function extractTasks(message: string) {
    try {
      const res = await fetch("/api/chat/extract-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const { tasks } = await res.json();
      if (tasks && tasks.length > 0) {
        setPendingTasks(tasks);
      }
    } catch {
      // silently ignore
    }
  }

  async function confirmTask(task: PendingTask, index: number) {
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    });
    setPendingTasks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, confirmed: true } : t)),
    );
    setTimeout(() => {
      setPendingTasks((prev) => prev.filter((_, i) => i !== index));
    }, 1500);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center gap-2 border-b px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-semibold">VIVI</h1>
          <p className="text-xs text-muted-foreground">AIアシスタント</p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
              <Sparkles className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-lg font-semibold">こんにちは！VIVIです</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-xs">
              タスクの整理、スケジュール確認、なんでも話しかけてください ✨
            </p>
            <div className="mt-6 flex flex-col gap-2 w-full max-w-xs">
              {[
                "今日やることを整理して",
                "明日の会議の準備タスクを作って",
                "今週のタスクをまとめて",
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => { setInput(prompt); textareaRef.current?.focus(); }}
                  className="rounded-xl border px-4 py-2.5 text-sm text-left hover:bg-muted transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Pending Task Suggestions */}
        {pendingTasks.length > 0 && (
          <div className="rounded-xl border bg-indigo-50 dark:bg-indigo-950/30 p-3">
            <p className="text-xs font-medium text-indigo-700 dark:text-indigo-400 mb-2">
              💡 タスクとして登録しますか？
            </p>
            <div className="space-y-2">
              {pendingTasks.map((task, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-white dark:bg-gray-900 px-3 py-2"
                >
                  <span className="text-sm">{task.title}</span>
                  <button
                    onClick={() => confirmTask(task, i)}
                    className={cn(
                      "flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium",
                      task.confirmed
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-indigo-600 text-white",
                    )}
                  >
                    {task.confirmed ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                    {task.confirmed ? "追加済み" : "追加"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t bg-background px-4 py-3">
        <div className="flex items-end gap-2 rounded-2xl border bg-muted/50 px-3 py-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="メッセージを入力..."
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground max-h-32"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isStreaming}
            className="shrink-0 rounded-full bg-indigo-600 p-2 text-white disabled:opacity-40 transition-opacity"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          Shift+Enter で改行
        </p>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600">
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
          isUser
            ? "bg-indigo-600 text-white rounded-br-sm"
            : "bg-muted rounded-bl-sm",
        )}
      >
        {message.content || (
          <span className="inline-flex gap-1">
            <span className="animate-bounce">·</span>
            <span className="animate-bounce [animation-delay:0.1s]">·</span>
            <span className="animate-bounce [animation-delay:0.2s]">·</span>
          </span>
        )}
      </div>
    </div>
  );
}
