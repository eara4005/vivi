export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskCategory = "private" | "work";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  category: TaskCategory;
  tags: string[];
  dueDate?: string; // ISO 8601
  createdAt: string;
  updatedAt: string;
  sourceNote?: string; // Obsidian note path
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ExtractedTask {
  title: string;
  description?: string;
  category: TaskCategory;
  tags: string[];
  dueDate?: string;
}

export interface AppSettings {
  obsidianVaultPath: string;
  defaultCategory: TaskCategory;
  googleCalendarEnabled: boolean;
}
