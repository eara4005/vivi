import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface ObsidianNote {
  title: string;
  path: string;
  content: string;
  frontmatter: Record<string, unknown>;
  modified: Date;
}

export function getVaultPath(): string {
  return (
    process.env.OBSIDIAN_VAULT_PATH ||
    "C:/Users/shingo/Desktop/my-claude/vault"
  );
}

function walkDir(dir: string, results: string[] = []): string[] {
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, results);
    } else if (entry.name.endsWith(".md")) {
      results.push(fullPath);
    }
  }
  return results;
}

export function listNotes(): ObsidianNote[] {
  const vaultPath = getVaultPath();
  const files = walkDir(vaultPath);
  return files.map((filePath) => {
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(raw);
    const stats = fs.statSync(filePath);
    return {
      title: path.basename(filePath, ".md"),
      path: path.relative(vaultPath, filePath),
      content,
      frontmatter: data as Record<string, unknown>,
      modified: stats.mtime,
    };
  });
}

export function getNote(notePath: string): ObsidianNote | null {
  const vaultPath = getVaultPath();
  const fullPath = path.join(vaultPath, notePath);
  if (!fs.existsSync(fullPath)) return null;
  const raw = fs.readFileSync(fullPath, "utf-8");
  const { data, content } = matter(raw);
  const stats = fs.statSync(fullPath);
  return {
    title: path.basename(fullPath, ".md"),
    path: notePath,
    content,
    frontmatter: data as Record<string, unknown>,
    modified: stats.mtime,
  };
}

export function searchNotes(query: string): ObsidianNote[] {
  const lower = query.toLowerCase();
  return listNotes().filter(
    (note) =>
      note.title.toLowerCase().includes(lower) ||
      note.content.toLowerCase().includes(lower),
  );
}
