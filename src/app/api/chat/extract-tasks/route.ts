import { NextRequest, NextResponse } from "next/server";
import { extractTasksFromMessage } from "@/lib/anthropic";

export async function POST(req: NextRequest) {
  const { message } = await req.json();
  if (!message) return NextResponse.json({ error: "message required" }, { status: 400 });
  const tasks = await extractTasksFromMessage(message);
  return NextResponse.json({ tasks });
}
