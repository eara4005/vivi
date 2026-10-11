import { NextRequest, NextResponse } from "next/server";
import { getNote, listNotes, searchNotes } from "@/lib/obsidian";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const notePath = searchParams.get("path");

  if (notePath) {
    const note = getNote(notePath);
    if (!note) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(note);
  }

  if (q) {
    return NextResponse.json(searchNotes(q));
  }

  const notes = listNotes().map(({ title, path, frontmatter, modified }) => ({
    title,
    path,
    frontmatter,
    modified,
  }));
  return NextResponse.json(notes);
}
