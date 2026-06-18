export type NavItem = {
  /** URL path, e.g. "/about" */
  href: string;
  /** label shown in the sidebar file tree, e.g. "about.md" */
  fileLabel: string;
  /** label shown in the mobile top nav, e.g. "about" */
  navLabel: string;
  /** segment used for matching, e.g. "about" (root page is "") */
  segment: string;
};

export const navItems: NavItem[] = [
  { href: "/", fileLabel: "index.tsx", navLabel: "home", segment: "" },
  { href: "/about", fileLabel: "about.md", navLabel: "about", segment: "about" },
  { href: "/projects", fileLabel: "projects/", navLabel: "work", segment: "projects" },
  { href: "/contact", fileLabel: "contact.json", navLabel: "contact", segment: "contact" },
];

/** Maps terminal "cd" targets (including aliases) to a route href. */
const cdAliases: Record<string, string> = {
  home: "/",
  index: "/",
  root: "/",
  "~": "/",
  "": "/",
  about: "/about",
  projects: "/projects",
  project: "/projects",
  work: "/projects",
  contact: "/contact",
};

/**
 * Resolves a `cd` target typed into the terminal to a route, or null if
 * the target doesn't match any known section.
 */
export function resolveCdTarget(rawTarget: string): string | null {
  const cleaned = rawTarget
    .trim()
    .toLowerCase()
    .replace(/^~?\/*/, "")
    .replace(/\/$/, "");

  const key = cleaned === "" ? "home" : cleaned;
  return cdAliases[key] ?? null;
}
