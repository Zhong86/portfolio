"use client";
import { useRouter } from "next/navigation";
import { useRef, useState, useEffect, useMemo } from "react";
import { resolveCdTarget } from "@/lib/navigation";

type PaletteItem = {
  cmd: string;       // full command, e.g. "cd projects"
  label: string;     // human description shown beside it
  keyword: string;   // the part after "cd " — used for filtering once user types "cd "
};

const NAV_ITEMS: PaletteItem[] = [
  { cmd: "cd home", label: "go to homepage", keyword: "home" },
  { cmd: "cd about", label: "about me", keyword: "about" },
  { cmd: "cd projects", label: "projects applied / built", keyword: "projects" },
  { cmd: "cd contact", label: "contact info", keyword: "contact" },
];

function fuzzyMatch(query: string, target: string): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return true;
  const t = target.toLowerCase();
  // simple subsequence fuzzy match, fzf-lite
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}

export default function Terminal() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const [attention, setAttention] = useState(true);
  const [value, setValue] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const errorTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setAttention(false), 2200);
    return () => clearTimeout(t);
  }, []);

  function showError(message: string) {
    setError(message);
    if (errorTimeout.current) clearTimeout(errorTimeout.current);
    errorTimeout.current = setTimeout(() => setError(null), 2600);
  }

  // Filtered palette results based on current input
  const filtered = useMemo(() => {
    const trimmed = value.trimStart();
    // If they've typed "cd" (with or without trailing space/partial word),
    // match against the keyword portion. Otherwise match against full cmd.
    const cdMatch = trimmed.match(/^cd\s*(.*)$/i);
    if (cdMatch) {
      const rest = cdMatch[1];
      return NAV_ITEMS.filter((item) => fuzzyMatch(rest, item.keyword));
    }
    if (!trimmed) return NAV_ITEMS;
    return NAV_ITEMS.filter(
      (item) => fuzzyMatch(trimmed, item.cmd) || fuzzyMatch(trimmed, item.label)
    );
  }, [value]);

  const showPalette = focused && filtered.length > 0;

  useEffect(() => {
    setActiveIndex(0);
  }, [filtered.length, value]);

  function selectItem(item: PaletteItem) {
    setValue(item.cmd);
    inputRef.current?.focus();
  }

  function runCommand(raw: string) {
    const input = raw.trim();
    if (!input) return;
    const parts = input.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    if (cmd === "cd") {
      const target = resolveCdTarget(parts[1] ?? "home");
      if (target) {
        router.push(target);
        setValue("");
        inputRef.current?.blur();
      } else {
        showError(`cd: no such section: ${parts[1] ?? ""}`);
      }
      return;
    }
    showError(
      `command not found: ${cmd} — try "cd home", "cd about", "cd projects", or "cd contact"`
    );
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (showPalette && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      setActiveIndex((prev) => {
        const dir = e.key === "ArrowDown" ? 1 : -1;
        const next = (prev + dir + filtered.length) % filtered.length;
        return next;
      });
      return;
    }
    if (showPalette && e.key === "Tab") {
      e.preventDefault();
      if (filtered[activeIndex]) selectItem(filtered[activeIndex]);
      return;
    }
    if (e.key === "Enter") {
      if (showPalette && filtered[activeIndex] && filtered.length > 0) {
        runCommand(filtered[activeIndex].cmd);
        setValue("");
      } else {
        runCommand(value);
        setValue("");
      }
      return;
    }
    if (e.key === "Escape") {
      inputRef.current?.blur();
    }
  }

  return (
    <div className="fixed bottom-15 left-0 md:left-[max(250px,calc((100vw-1180px)/2+140px))] right-0 px-4 md:pr-14 z-20 pointer-events-none">
      <div className="max-w-[760px] mx-auto pointer-events-auto relative">
        {/* Palette: anchored above the terminal bar */}
        <div
          className={`absolute bottom-full left-0 right-0 mb-2 rounded-lg border border-hairline bg-surface-2/97 backdrop-blur-md shadow-xl shadow-black/50 overflow-hidden transition-all duration-150 origin-bottom ${
            showPalette
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-95 translate-y-1 pointer-events-none"
          }`}
        >
          <div className="px-4 py-2 border-b border-hairline/60 font-mono text-[10px] text-text-dimmer uppercase tracking-wide flex justify-between">
            <span>navigate</span>
            <span>↑↓ select · tab fill · enter go</span>
          </div>
          <div ref={listRef} className="max-h-52 overflow-y-auto py-1">
            {filtered.map((item, i) => (
              <button
                key={item.cmd}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  runCommand(item.cmd);
                  setValue("");
                }}
                onMouseEnter={() => setActiveIndex(i)}
                className={`w-full flex items-center justify-between gap-3 px-4 py-2 font-mono text-[13px] text-left transition-colors ${
                  i === activeIndex
                    ? "bg-accent/15 text-accent"
                    : "text-text hover:bg-surface-3/60"
                }`}
              >
                <span className="shrink-0">{item.cmd}</span>
                <span className="text-text-dimmer text-[11px] truncate">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Terminal bar */}
        <div
          className={`rounded-lg border bg-surface-2/95 backdrop-blur-md transition-all duration-300 ${
            attention
              ? "border-accent shadow-[0_0_0_1px_var(--color-accent),0_0_24px_4px_rgba(var(--color-accent-rgb,255,153,0),0.35)] animate-terminal-attention"
              : focused
              ? "border-accent/70 shadow-[0_0_0_1px_var(--color-accent),0_0_20px_2px_rgba(var(--color-accent-rgb,255,153,0),0.2)]"
              : "border-hairline shadow-lg shadow-black/40"
          }`}
        >
          <div
            className={`px-4 md:px-6 font-mono text-xs text-accent border-b border-hairline/60 transition-all duration-150 overflow-hidden ${
              error ? "max-h-10 py-2 opacity-100" : "max-h-0 py-0 opacity-0 border-b-0"
            }`}
          >
            {error}
          </div>
          <div className="flex items-center h-12 gap-2.5 px-4 md:px-6">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                focused ? "bg-green animate-pulse" : "bg-text-dimmer"
              }`}
              aria-hidden
            />
            <span className="font-mono text-[13px] text-green shrink-0 whitespace-nowrap">
              Zhong86<span className="text-accent">:~$</span>
            </span>
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="cd projects, cd about, cd contact, cd home…"
              autoComplete="off"
              spellCheck={false}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              className="flex-1 bg-transparent border-none outline-none font-mono text-[13.5px] text-text placeholder:text-text-dimmer"
              style={{ caretColor: "var(--color-accent)" }}
            />
            <span className="hidden lg:block font-mono text-[11px] text-text-dimmer shrink-0">
              try: cd projects
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
