// src/lib/information.ts
import fs from "fs";
import path from "path";
import {
  ABOUT_INFO,
  EXPERIENCES,
  PROJECTS,
  CATEGORIES,
  WEEKLY_GOALS,
  TOP_GOALS,
} from "@/lib/config";

/**
 * Single registry of everything the Talos agent can look up.
 * - "coding" / "profession" / "hobbies" / "contact" are backed by information/*.md
 * - "about" / "projects" / "goals" are backed by structured data in config.ts
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
  goals: "Billy's AWS backend internship goal tracker — target categories, weekly sprint, and top priorities.",
} as const;

export type InfoTopic = keyof typeof INFO_TOPICS;

const MARKDOWN_TOPICS: ReadonlySet<InfoTopic> = new Set(["coding", "profession", "hobbies", "contact"]);

function loadMarkdownTopic(topic: string): string {
  const safeTopic = path.basename(topic); // guard against path traversal
  const filePath = path.join(process.cwd(), "information", `${safeTopic}.md`);
  if (!fs.existsSync(filePath)) {
    return `No information file found for topic "${topic}".`;
  }
  return fs.readFileSync(filePath, "utf-8");
}

function loadAboutTopic(): string {
  const schema = ABOUT_INFO.map((r) => `- ${r.field}: ${r.value}`).join("\n");
  const timeline = EXPERIENCES.slice(0, 10)
    .map((e) => `- ${e.ts} [${e.service}] ${e.msg}`)
    .join("\n");
  return `# ABOUT\n\n## Profile\n${schema}\n\n## Recent Timeline\n${timeline}`;
}

function loadProjectsTopic(): string {
  return PROJECTS.map(
    (p) => `## ${p.title} (${p.status})\nStack: ${p.stack.join(", ")}\n${p.description}`
  ).join("\n\n");
}

function loadGoalsTopic(): string {
  const cats = CATEGORIES.map((c) => `- ${c.label}: target ${c.target} ${c.unit}`).join("\n");
  const weekly = WEEKLY_GOALS.map((g) => `- ${g.label}: target ${g.target} ${g.unit}`).join("\n");
  const top = TOP_GOALS.map((g) => `- ${g.title}: ${g.desc}`).join("\n");
  return `# GOALS\n\n## Long-term categories\n${cats}\n\n## This week's sprint\n${weekly}\n\n## Top priorities\n${top}`;
}

/** Resolves a topic name to plain-text content, regardless of which backend it lives in. */
export function loadInformation(topic: string): string {
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
      return loadMarkdownTopic(topic);
  }
}
