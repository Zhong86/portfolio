// src/lib/logs.ts
// Learn-log storage. Entries live in the KV hash "logs", keyed by slug
// (`<title-with-dashes>_<YYYY-MM-DD>`), so the slug encodes both title and date.
import { kv } from "@vercel/kv";

export const LOG_CATEGORIES = ["dsa", "concepts"] as const;
export type LogCategory = (typeof LOG_CATEGORIES)[number];

export interface LearnLog {
  slug: string;
  title: string;
  date: string;
  content: string;
  category?: LogCategory | null;
}

type StoredLog = Omit<LearnLog, "slug" | "title">;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDate(date: unknown): date is string {
  return typeof date === "string" && DATE_RE.test(date);
}

export function isValidCategory(category: unknown): boolean {
  return (
    category === undefined ||
    category === null ||
    (typeof category === "string" && (LOG_CATEGORIES as readonly string[]).includes(category))
  );
}

/** Recovers the display title from a slug (everything before the trailing _date). */
export function extractTitle(slug: string): string {
  return slug.split("_").slice(0, -1).join("_").replace(/-/g, " ");
}

export function makeSlug(title: string, date: string): string {
  return `${title.trim().replace(/\s+/g, "-")}_${date}`;
}

export async function listLogs(): Promise<LearnLog[]> {
  const logsMap = await kv.hgetall<Record<string, StoredLog>>("logs");
  if (!logsMap) return [];

  return Object.entries(logsMap)
    .map(([slug, data]) => ({
      slug,
      title: extractTitle(slug),
      date: data.date,
      content: data.content,
      category: data.category,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function getLog(slug: string): Promise<StoredLog | null> {
  const entry = await kv.hget<StoredLog>("logs", slug);
  return entry ?? null;
}

/** Creates or overwrites an entry. Returns the slug it was stored under. */
export async function saveLog(
  title: string,
  date: string,
  content: string,
  category?: LogCategory | null
): Promise<string> {
  const slug = makeSlug(title, date);
  await kv.hset("logs", { [slug]: { date, content, category: category ?? null } });
  return slug;
}

export async function deleteLog(slug: string): Promise<void> {
  await kv.hdel("logs", slug);
}

export type UpdateOutcome =
  | { ok: true; slug: string }
  | { ok: false; reason: "not_found" | "conflict" };

/**
 * Patches an existing entry. Because the slug is derived from title+date,
 * changing either one moves the entry to a new slug (old key is removed).
 * Refuses to clobber a different existing entry.
 */
export async function updateLog(
  slug: string,
  patch: { title?: string; date?: string; content?: string; category?: LogCategory | null }
): Promise<UpdateOutcome> {
  const existing = await getLog(slug);
  if (!existing) return { ok: false, reason: "not_found" };

  const nextTitle = patch.title?.trim() || extractTitle(slug);
  const nextDate = patch.date ?? existing.date;
  const nextContent = patch.content ?? existing.content;
  const nextCategory = patch.category !== undefined ? patch.category : existing.category ?? null;

  const nextSlug = makeSlug(nextTitle, nextDate);

  if (nextSlug !== slug && (await getLog(nextSlug))) {
    return { ok: false, reason: "conflict" };
  }

  await kv.hset("logs", {
    [nextSlug]: { date: nextDate, content: nextContent, category: nextCategory },
  });
  if (nextSlug !== slug) {
    await deleteLog(slug);
  }

  return { ok: true, slug: nextSlug };
}
