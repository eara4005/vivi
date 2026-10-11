import { NextRequest, NextResponse } from "next/server";
import { anthropic, buildSystemPromptWithContext, convertToSdkMessages } from "@/lib/anthropic";
import { getChatSession, getTasks, upsertChatSession } from "@/lib/storage";
import { ChatMessage, ChatSession } from "@/types";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const { sessionId, message } = await req.json();

  const id = sessionId ?? randomUUID();
  const session: ChatSession = getChatSession(id) ?? {
    id,
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const userMessage: ChatMessage = {
    id: randomUUID(),
    role: "user",
    content: message,
    createdAt: new Date().toISOString(),
  };
  session.messages.push(userMessage);

  const tasks = getTasks();
  const systemPrompt = buildSystemPromptWithContext({
    tasks,
    currentDate: new Date().toLocaleString("ja-JP"),
  });

  // Streaming response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const sdkStream = anthropic.messages.stream({
          model: process.env.CLAUDE_MODEL ?? "claude-haiku-4-5-20251001",
          max_tokens: 2048,
          system: systemPrompt,
          messages: convertToSdkMessages(session.messages),
        });

        let fullText = "";
        for await (const event of sdkStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            const chunk = event.delta.text;
            fullText += chunk;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
          }
        }

        // Save assistant message
        const assistantMessage: ChatMessage = {
          id: randomUUID(),
          role: "assistant",
          content: fullText,
          createdAt: new Date().toISOString(),
        };
        session.messages.push(assistantMessage);
        session.updatedAt = new Date().toISOString();
        upsertChatSession(session);

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true, sessionId: id })}\n\n`),
        );
        controller.close();
      } catch (error) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: String(error) })}\n\n`),
        );
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  const session = getChatSession(sessionId);
  if (!session) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(session);
}
