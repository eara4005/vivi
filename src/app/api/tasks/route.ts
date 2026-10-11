import { NextRequest, NextResponse } from "next/server";
import { createTask, deleteTask, getTasks, updateTask } from "@/lib/storage";
import { Task } from "@/types";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const tag = searchParams.get("tag");
  const status = searchParams.get("status");

  let tasks = getTasks();
  if (category) tasks = tasks.filter((t) => t.category === category);
  if (tag) tasks = tasks.filter((t) => t.tags.includes(tag));
  if (status) tasks = tasks.filter((t) => t.status === status);

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const now = new Date().toISOString();
  const task: Task = {
    id: randomUUID(),
    title: body.title,
    description: body.description,
    status: body.status ?? "todo",
    category: body.category ?? "private",
    tags: body.tags ?? [],
    dueDate: body.dueDate,
    createdAt: now,
    updatedAt: now,
    sourceNote: body.sourceNote,
  };
  return NextResponse.json(createTask(task), { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const updated = updateTask(id, updates);
  if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const ok = deleteTask(id);
  if (!ok) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
