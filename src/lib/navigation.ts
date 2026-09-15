export type NavItem = {
  /** URL path, e.g. "/about" */
  href: string;
  /** label shown in the sidebar file tree, e.g. "about.md" */
  fileLabel: string;
  /** label shown in the mobile top nav, e.g. "about" */
  navLabel: string;
  /** segment used for matching, e.g. "about" (root page is "") */
  segment: string;
  /** hidden from nav and unreachable by `cd` unless the sudo session is unlocked */
  sudoOnly?: boolean;
};

export const navItems: NavItem[] = [
  { href: "/", fileLabel: "index.tsx", navLabel: "home", segment: "" },
  { href: "/about", fileLabel: "about.md", navLabel: "about", segment: "about" },
  { href: "/goals", fileLabel: "goals.log", navLabel: "goals", segment: "goals", sudoOnly: true },
  { href: "/stats", fileLabel: "stats.json", navLabel: "stats", segment: "stats" },
  { href: "/projects", fileLabel: "projects/", navLabel: "work", segment: "projects" },
  { href: "/tools", fileLabel: "tools.json", navLabel: "tools", segment: "tools" },
  { href: "/contact", fileLabel: "contact.json", navLabel: "contact", segment: "contact" },
];

/** The nav entries a visitor may see, given their sudo state. */
export function visibleNavItems(isSudo: boolean | null): NavItem[] {
  return isSudo ? navItems : navItems.filter((item) => !item.sudoOnly);
}

/** Routes that only exist for an unlocked sudo session. */
const sudoOnlyHrefs = new Set(
  navItems.filter((item) => item.sudoOnly).map((item) => item.href)
);

export function isSudoOnlyHref(href: string): boolean {
  return sudoOnlyHrefs.has(href);
}

/** Maps terminal "cd" targets (including aliases) to a route href. */
const cdAliases: Record<string, string> = {
  home: "/",
  index: "/",
  root: "/",
  "~": "/",
  "": "/",
  about: "/about",
  goals: "/goals",
  aws: "/goals",
  projects: "/projects",
  project: "/projects",
  work: "/projects",
  stats: "/stats",
  github: "/stats",
  activity: "/stats",
  tools: "/tools",
  contact: "/contact",
  anapsychis: "/goals",
};

/**
 * Resolves a `cd` target typed into the terminal to a route, or null if the
 * target doesn't match any known section. Sudo-only sections resolve to null
 * while locked, so they read as "no such directory" rather than advertising
 * themselves.
 */
export function resolveCdTarget(rawTarget: string, isSudo: boolean | null = null): string | null {
  const cleaned = rawTarget
    .trim()
    .toLowerCase()
    .replace(/^~?\/*/, "")
    .replace(/\/$/, "");

  const key = cleaned === "" ? "home" : cleaned;
  const href = cdAliases[key] ?? null;
  if (href && !isSudo && isSudoOnlyHref(href)) return null;
  return href;
}
