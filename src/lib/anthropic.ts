import Anthropic from "@anthropic-ai/sdk";
import { ChatMessage, ExtractedTask, Task } from "@/types";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `あなたはVIVI（ビビ）という名前のパーソナルAIアシスタントです。
ユーザーのタスク管理、スケジュール、日常の質問をサポートします。

ユーザーのコンテキスト:
- タスク管理システムと連携しています
- Google Calendarと連携しています
- Obsidianノートと連携しています

会話の姿勢:
- 親しみやすく、でも効率的に
- 日本語で会話する
- ユーザーの意図を積極的に読み取る
- タスクや予定に関する言及があれば自然に拾い上げる`;

export interface ChatContext {
  tasks?: Task[];
  currentDate?: string;
}

export function buildSystemPromptWithContext(context: ChatContext): string {
  let prompt = SYSTEM_PROMPT;

  if (context.currentDate) {
    prompt += `\n\n現在の日時: ${context.currentDate}`;
  }

  if (context.tasks && context.tasks.length > 0) {
    const pending = context.tasks.filter((t) => t.status !== "done");
    prompt += `\n\n現在のタスク (未完了 ${pending.length}件):\n`;
    prompt += pending
      .slice(0, 10)
      .map((t) => `- [${t.category}] ${t.title}${t.dueDate ? ` (期限: ${t.dueDate})` : ""}`)
      .join("\n");
  }

  return prompt;
}

export async function extractTasksFromMessage(message: string): Promise<ExtractedTask[]> {
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `以下のメッセージから、タスクとして登録すべき項目を抽出してください。
タスクがなければ空の配列を返してください。

メッセージ: "${message}"

以下のJSON形式で返してください（コードブロックなし）:
[
  {
    "title": "タスクタイトル",
    "description": "詳細（任意）",
    "category": "private" または "work",
    "tags": ["タグ1", "タグ2"],
    "dueDate": "YYYY-MM-DD（任意）"
  }
]`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  try {
    return JSON.parse(text) as ExtractedTask[];
  } catch {
    return [];
  }
}

export function convertToSdkMessages(
  messages: ChatMessage[],
): Anthropic.MessageParam[] {
  return messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));
}
