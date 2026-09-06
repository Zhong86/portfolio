// Theme switching for the `theme` terminal command.
// The default theme is the absence of a data-theme attribute, so any extra
// theme is purely additive — see src/app/themes/*.css.

export const THEME_STORAGE_KEY = "theme";

export const THEMES = ["default", "nier"] as const;
export type ThemeName = (typeof THEMES)[number];

const ALIASES: Record<string, ThemeName> = {
  default: "default",
  reset: "default",
  off: "default",
  main: "default",
  nier: "nier",
};

export function normalizeTheme(input: string): ThemeName | null {
  return ALIASES[input.trim().toLowerCase()] ?? null;
}

export function applyTheme(theme: ThemeName) {
  const root = document.documentElement;
  if (theme === "default") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // storage blocked — theme still applies for this session
  }
}

export function currentTheme(): ThemeName {
  const attr = document.documentElement.getAttribute("data-theme");
  return (THEMES as readonly string[]).includes(attr ?? "") ? (attr as ThemeName) : "default";
}

// Inlined in <head> so the theme is painted before hydration (no flash).
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t&&t!=="default")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;
