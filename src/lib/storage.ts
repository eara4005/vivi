/**
 * Simple JSON file-based storage layer.
 * Runs server-side only (Next.js API routes / Server Actions).
 */
import fs from "fs";
import path from "path";
import { Task, ChatSession } from "@/types";

const DATA_DIR = path.join(process.cwd(), "data");

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readJson<T>(filePath: string, fallback: T): T {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(filePath: string, data: unknown): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// ── Tasks ──────────────────────────────────────────────────────────────────

const TASKS_FILE = path.join(DATA_DIR, "tasks.json");

export function getTasks(): Task[] {
  return readJson<Task[]>(TASKS_FILE, []);
}

export function getTask(id: string): Task | undefined {
  return getTasks().find((t) => t.id === id);
}

export function saveTasks(tasks: Task[]): void {
  writeJson(TASKS_FILE, tasks);
}

export function createTask(task: Task): Task {
  const tasks = getTasks();
  tasks.push(task);
  saveTasks(tasks);
  return task;
}

export function updateTask(id: string, updates: Partial<Task>): Task | null {
  const tasks = getTasks();
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return null;
  tasks[index] = { ...tasks[index], ...updates, updatedAt: new Date().toISOString() };
  saveTasks(tasks);
  return tasks[index];
}

export function deleteTask(id: string): boolean {
  const tasks = getTasks();
  const filtered = tasks.filter((t) => t.id !== id);
  if (filtered.length === tasks.length) return false;
  saveTasks(filtered);
  return true;
}

// ── Chat Sessions ──────────────────────────────────────────────────────────

const SESSIONS_FILE = path.join(DATA_DIR, "chat-sessions.json");

export function getChatSessions(): ChatSession[] {
  return readJson<ChatSession[]>(SESSIONS_FILE, []);
}

export function getChatSession(id: string): ChatSession | undefined {
  return getChatSessions().find((s) => s.id === id);
}

export function saveChatSessions(sessions: ChatSession[]): void {
  writeJson(SESSIONS_FILE, sessions);
}

export function upsertChatSession(session: ChatSession): ChatSession {
  const sessions = getChatSessions();
  const index = sessions.findIndex((s) => s.id === session.id);
  if (index === -1) {
    sessions.push(session);
  } else {
    sessions[index] = session;
  }
  saveChatSessions(sessions);
  return session;
}
