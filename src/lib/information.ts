// src/lib/information.ts
import { kv } from "@vercel/kv";
import {
  AboutField,
  DEFAULT_ABOUT_INFO,
  EXPERIENCES,
  Migration,
  DEFAULT_PROJECTS,
  CATEGORIES,
  WEEKLY_GOALS,
  TOP_GOALS,
  MARKDOWN_TOPICS,
  MarkdownTopic,
  DEFAULT_MARKDOWN_INFO,
} from "@/lib/config";
import { resolveCurrentWeek } from "@/lib/weekly";

/**
 * Single registry of everything the Talos agent can look up.
 * - "coding" / "profession" / "hobbies" / "contact" are markdown blobs in KV (`info:<topic>`),
 *   seeded from DEFAULT_MARKDOWN_INFO when no entry exists yet
 * - "about" / "projects" are backed by structured data in config.ts
 * - "goals" combines config.ts targets with the live counters in KV
 *   ("goals:progress" and the current "weekly:<monday>" record)
 * Both sources are normalized to plain text here, so the agent doesn't
 * need to know or care where a topic's data actually lives.
 */
export const INFO_TOPICS = {
  coding: "Programming languages, frameworks, technical skills, and projects Billy has built.",
  profession: "Billy's work experience, job history, internships, and career background.",
  hobbies: "Billy's interests and activities outside of coding/work.",
  contact: "Billy's contacts to connect with him.",
  about: "Billy's quick-reference profile: roles, focus areas, tech stack, and career timeline.",
  projects: "Projects Billy has built or contributed to, including tech stack and status.",
  goals:
    "Billy's AWS backend internship goal tracker — long-term categories, this week's sprint checklist, and top priorities, each with live progress against its target.",
} as const;

export type InfoTopic = keyof typeof INFO_TOPICS;

const MARKDOWN_TOPIC_SET: ReadonlySet<string> = new Set(MARKDOWN_TOPICS);

/** True for topics whose full text is stored in KV and can be rewritten. */
export function isEditableTopic(topic: string): topic is MarkdownTopic {
  return MARKDOWN_TOPIC_SET.has(topic);
}

function infoKey(topic: MarkdownTopic): string {
  return `info:${topic}`;
}

async function loadMarkdownTopic(topic: MarkdownTopic): Promise<string> {
  const stored = await kv.get<string>(infoKey(topic)).catch(() => null);
  return typeof stored === "string" && stored.trim() ? stored : DEFAULT_MARKDOWN_INFO[topic];
}

async function loadAboutTopic(): Promise<string> {
  const stored = await kv.get<AboutField[]>("about").catch(() => null);
  const fields = stored && stored.length > 0 ? stored : DEFAULT_ABOUT_INFO;
  const schema = fields.map((r) => `- ${r.field}: ${r.value}`).join("\n");
  const timeline = EXPERIENCES.slice(0, 10)
    .map((e) => `- ${e.ts} [${e.service}] ${e.msg}`)
    .join("\n");
  return `# ABOUT\n\n## Profile\n${schema}\n\n## Recent Timeline\n${timeline}`;
}

async function loadProjectsTopic(): Promise<string> {
  const stored = await kv.get<Migration[]>("projects").catch(() => null);
  const projects = stored && stored.length > 0 ? stored : DEFAULT_PROJECTS;
  return projects
    .map((p) => `## ${p.title} (${p.status})\nStack: ${p.stack.join(", ")}\n${p.description}`)
    .join("\n\n");
}

/**
 * Goals, with the live counters folded in so the agent reports actual progress
 * rather than just the targets. Reads the same KV keys the goals page does.
 */
async function loadGoalsTopic(): Promise<string> {
  const [overall, week] = await Promise.all([
    kv.get<Record<string, number>>("goals:progress").catch(() => null),
    resolveCurrentWeek().catch(() => null),
  ]);

  const overallValues = overall ?? {};
  const weeklyValues = week?.values ?? {};

  const cats = CATEGORIES.map((c) => {
    const done = overallValues[c.id] ?? 0;
    const pct = c.target > 0 ? Math.round((done / c.target) * 100) : 0;
    return `- ${c.label}: ${done}/${c.target} ${c.unit} (${pct}%)`;
  }).join("\n");

  const weekly = WEEKLY_GOALS.map((g) => {
    const done = weeklyValues[g.id] ?? 0;
    const status = done >= g.target ? "done" : `${g.target - done} to go`;
    return `- ${g.label}: ${done}/${g.target} ${g.unit} — ${status}`;
  }).join("\n");

  const top = TOP_GOALS.map((g) => `- ${g.title}: ${g.desc}`).join("\n");
  const weekLabel = week ? `## This week's sprint (week of ${week.key})` : "## This week's sprint";

  return `# GOALS\n\n## Long-term categories\n${cats}\n\n${weekLabel}\n${weekly}\n\n## Top priorities\n${top}`;
}

/** Resolves a topic name to plain-text content, regardless of which backend it lives in. */
export async function loadInformation(topic: string): Promise<string> {
  if (!(topic in INFO_TOPICS)) {
    return `Unknown topic "${topic}". Available topics: ${Object.keys(INFO_TOPICS).join(", ")}.`;
  }
  switch (topic as InfoTopic) {
    case "about":
      return loadAboutTopic();
    case "projects":
      return loadProjectsTopic();
    case "goals":
      return loadGoalsTopic();
    default:
      return loadMarkdownTopic(topic as MarkdownTopic);
  }
}

/** Overwrites a markdown topic's content in KV. Only editable topics are accepted. */
export async function saveInformation(topic: MarkdownTopic, content: string): Promise<void> {
  await kv.set(infoKey(topic), content);
}

/** Drops the KV entry so the topic falls back to its DEFAULT_MARKDOWN_INFO seed. */
export async function resetInformation(topic: MarkdownTopic): Promise<void> {
  await kv.del(infoKey(topic));
}
