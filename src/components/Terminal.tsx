"use client";
import { useRouter } from "next/navigation";
import { useRef, useState, useEffect, useMemo } from "react";
import { resolveCdTarget } from "@/lib/navigation";
import { AI_MAX_MESSAGES, NAV_ITEMS, PaletteItem, SUDO_MAX_ATTEMPTS } from "@/lib/config";
import { applyTheme, currentTheme, normalizeTheme, THEME_LABELS, THEMES } from "@/lib/theme";
import { currentSfxMode, normalizeSfxMode, playSfx, prefetchSfx, setSfxMode, SFX_LABELS, SFX_MODES } from "@/lib/sfx";
import { isTypingTarget } from "@/lib/keys";

type Message = { role: "user" | "assistant"; content: string };

function fuzzyMatch(query: string, target: string): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return true;
  const t = target.toLowerCase();
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

  // ── chat ──────────────────────────────────────────────────────────────────
  const [chatMode, setChatMode] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi I'm Talos, an AI specified to answer your questions about Zhong86. You can ask anything from his coding journey, experience and hobbies. I can even send him a message from you - make sure you provide a name." },
  ]);
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [exiting, setExiting] = useState(false);

  // ── sudo ──────────────────────────────────────────────────────────────────
  const [sudoMode, setSudoMode] = useState(false);
  const [sudoPassword, setSudoPassword] = useState("");
  const [sudoAttempts, setSudoAttempts] = useState(() => {
    if (typeof window === "undefined") return 0;
    return Number(localStorage.getItem("sudoAttempts") ?? 0);
  });
  const [sudoError, setSudoError] = useState<string | null>(null);
  const [sudoUnlocked, setSudoUnlocked] = useState(false);
  const [sudoExiting, setSudoExiting] = useState(false);
  const sudoInputRef = useRef<HTMLInputElement>(null);

  const errorTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // restore sudo session on mount
  useEffect(() => {
    if (localStorage.getItem("sudoUnlocked") === "true") {
      setSudoUnlocked(true);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setAttention(false), 2200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (chatMode) setTimeout(() => inputRef.current?.focus(), 300);
  }, [chatMode]);

  // "/" from anywhere on the page drops the caret into the terminal.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "/" || isTypingTarget(e) || sudoMode) return;
      e.preventDefault(); // otherwise the "/" lands in the input we just focused
      setAttention(false);
      inputRef.current?.focus();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sudoMode]);

  useEffect(() => {
    if (sudoMode) setTimeout(() => sudoInputRef.current?.focus(), 300);
  }, [sudoMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  function showError(message: string) {
    setError(message);
    if (errorTimeout.current) clearTimeout(errorTimeout.current);
    errorTimeout.current = setTimeout(() => setError(null), 2600);
  }

  // ── sudo helpers ──────────────────────────────────────────────────────────
  function openSudo() {
    setSudoPassword("");
    setSudoError(null);
    localStorage.removeItem("sudoAttempts");
    setSudoAttempts(0);
    setSudoExiting(false);
    setSudoMode(true);
  }

  function closeSudo(immediate = false) {
    if (immediate) { setSudoMode(false); return; }
    setSudoExiting(true);
    setTimeout(() => {
      setSudoMode(false);
      setSudoPassword("");
      setSudoError(null);
      setSudoExiting(false);
      inputRef.current?.focus();
    }, 200);
  }

  async function submitSudoPassword() {
    const res = await fetch("/api/sudo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: sudoPassword }),
    });
    if (res.ok) {
      localStorage.setItem("sudoUnlocked", "true");
      localStorage.setItem("sudoToken", sudoPassword);
      setSudoUnlocked(true);
      window.dispatchEvent(new Event("sudo-unlocked")); 
      closeSudo();
      showError("✓ sudo: session unlocked");
      return;
    }

    const used = sudoAttempts + 1;
    setSudoAttempts(used);
    localStorage.setItem("sudoAttempts", String(used));
    setSudoPassword("");

    if (used >= SUDO_MAX_ATTEMPTS) {
      setSudoError("sudo: 3 incorrect password attempts");
      setTimeout(() => closeSudo(), 1400);
    } else {
      setSudoError(`Sorry, try again. ${SUDO_MAX_ATTEMPTS - used} attempt${SUDO_MAX_ATTEMPTS - used === 1 ? "" : "s"} remaining.`);
    }
  }

  async function handleSudoKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") { e.preventDefault(); await submitSudoPassword(); }
    if (e.key === "Escape") closeSudo();
  }

  // ── chat helpers ──────────────────────────────────────────────────────────
  async function handleAsk(prompt: string) {
    if (!prompt.trim() || streaming) return;
    const userMsg: Message = { role: "user", content: prompt };
    const history = [...messages, userMsg].slice(-AI_MAX_MESSAGES);
    setMessages(history);
    setValue("");
    setStreaming(true);
    setStreamingText("");
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        body: JSON.stringify({ messages: history }),
      });
      if (!res.ok || !res.body) throw new Error(`ai request failed (${res.status})`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        // stream: true so multi-byte characters split across chunks survive decoding.
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // The trailing fragment may be half a data: line still in flight — hold it back.
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const { text: delta } = JSON.parse(line.slice(6));
              text += delta;
              setStreamingText(text);
            } catch { }
          }
        }
      }
      setMessages((prev) => [...prev, { role: "assistant", content: text }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong. Try again." }]);
    } finally {
      setStreaming(false);
      setStreamingText("");
      inputRef.current?.focus();
    }
  }

  const filtered = useMemo(() => {
    if (chatMode) return [];
    const trimmed = value.trimStart();
    const cdMatch = trimmed.match(/^cd\s*(.*)$/i);
    if (cdMatch) {
      const rest = cdMatch[1];
      return NAV_ITEMS.filter(
        (item) => item.cmd.startsWith("cd ") && fuzzyMatch(rest, item.keyword)
      );
    }
    if (!trimmed) return NAV_ITEMS;
    return NAV_ITEMS.filter(
      (item) => fuzzyMatch(trimmed, item.cmd) || fuzzyMatch(trimmed, item.label)
    );
  }, [value, chatMode]);

  const showPalette = focused && filtered.length > 0 && !chatMode;

  useEffect(() => { setActiveIndex(0); }, [filtered.length, value]);

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
      if (target) { router.push(target); setValue(""); inputRef.current?.blur(); }
      else showError(`cd: no such section: ${parts[1] ?? ""}`);
      return;
    }

    if (cmd === "talos_ai") {
      const prompt = parts.slice(1).join(" ");
      if (!chatMode) {
        setChatMode(true);
        if (prompt) setTimeout(() => handleAsk(prompt), 350);
      } else {
        handleAsk(prompt || value);
      }
      setValue("");
      return;
    }

    if (cmd === "theme") {
      const arg = parts[1];
      if (!arg) {
        showError(`theme: current "${currentTheme()}" · usage: theme <${THEMES.join("|")}>`);
        return;
      }
      const theme = normalizeTheme(arg);
      if (!theme) {
        showError(`theme: unknown theme: ${arg} · available: ${THEMES.join(", ")}`);
        return;
      }
      applyTheme(theme);
      prefetchSfx();
      playSfx("init"); // announce the new theme with its own boot sound
      setValue("");
      showError(`✓ theme: ${THEME_LABELS[theme]}`);
      return;
    }

    if (cmd === "sfx") {
      const arg = parts[1];
      if (!arg) {
        showError(`sfx: current "${currentSfxMode()}" · usage: sfx <${SFX_MODES.join("|")}>`);
        return;
      }
      const sfxMode = normalizeSfxMode(arg);
      if (!sfxMode) {
        showError(`sfx: unknown mode: ${arg} · available: ${SFX_MODES.join(", ")}`);
        return;
      }
      setSfxMode(sfxMode);
      setValue("");
      if (sfxMode === "off") {
        showError("✓ sfx: off");
      } else {
        prefetchSfx();
        playSfx("select"); // preview the new volume
        const themed = currentTheme() !== "default";
        showError(
          themed
            ? `✓ sfx: ${SFX_LABELS[sfxMode]}`
            : `✓ sfx: ${SFX_LABELS[sfxMode]} · silent on the default theme — try: theme nier`
        );
      }
      return;
    }

    if (cmd === "sudo") {
      if (sudoUnlocked) {
        showError("sudo: session already authenticated");
      } else {
        setValue("");
        openSudo();
      }
      return;
    }

    showError(`command not found: ${cmd}`);
  }

  function exitChat() {
    setExiting(true);
    setTimeout(() => {
      setChatMode(false);
      setMessages([]);
      setStreamingText("");
      setValue("");
      setExiting(false);
      inputRef.current?.blur();
    }, 200);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (chatMode) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const trimmed = value.trim();
        if (trimmed && !streaming) handleAsk(trimmed);
        setValue("");
      }
      if (e.key === "Escape") exitChat();
      return;
    }
    if (showPalette && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      playSfx("move");
      setActiveIndex((prev) => {
        const dir = e.key === "ArrowDown" ? 1 : -1;
        return (prev + dir + filtered.length) % filtered.length;
      });
      return;
    }
    if (showPalette && e.key === "Tab") {
      e.preventDefault();
      if (filtered[activeIndex]) selectItem(filtered[activeIndex]);
      return;
    }
    if (e.key === "Enter") {
      playSfx("select");
      if (showPalette && filtered[activeIndex] && filtered.length > 0) {
        runCommand(filtered[activeIndex].cmd);
        setValue("");
      } else {
        runCommand(value);
        setValue("");
      }
      return;
    }
    if (e.key === "Escape") inputRef.current?.blur();
  }

  // ── Sudo overlay ──────────────────────────────────────────────────────────
  const remainingAttempts = SUDO_MAX_ATTEMPTS - sudoAttempts;

  const SudoOverlay = sudoMode ? (
    <div data-modal-open className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto ${sudoExiting ? "animate-fadeOut" : "animate-fadeIn"}`}
        onClick={() => closeSudo()}
      />
      <div
        className={`relative pointer-events-auto w-full max-w-md mx-4 rounded-xl border border-accent/50 bg-surface-2/97 backdrop-blur-md shadow-2xl shadow-black/60 overflow-hidden ${sudoExiting ? "animate-slideDown" : "animate-slideUp"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-hairline/60 px-5 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" aria-hidden />
              <span className="font-mono text-[13px] text-green">
                Zhong86<span className="text-accent">:~$</span>{" "}
                <span className="text-text-dimmer">sudo — authentication required</span>
              </span>
            </div>
            <button
              onClick={() => closeSudo()}
              className="font-mono text-[11px] text-text-dimmer hover:text-accent transition-colors px-2 py-1 rounded hover:bg-surface-3/60"
            >
              esc · cancel
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-4">
          {/* Attempt dots */}
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-text-dimmer uppercase tracking-wide">
              Attempts remaining
            </span>
            <div className="flex gap-1.5">
              {Array.from({ length: SUDO_MAX_ATTEMPTS }).map((_, i) => (
                <span
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors duration-300 ${i < remainingAttempts ? "bg-green" : "bg-surface-3"}`}
                />
              ))}
            </div>
          </div>

          {/* Password input */}
          <div className="flex items-center gap-3 rounded-lg border border-hairline/60 bg-surface-3/40 px-4 py-2.5 focus-within:border-accent/60 transition-colors">
            <span className="font-mono text-[13px] text-accent shrink-0">[sudo] password:</span>
            <input
              ref={sudoInputRef}
              type="password"
              value={sudoPassword}
              onChange={(e) => setSudoPassword(e.target.value)}
              onKeyDown={handleSudoKeyDown}
              placeholder="············"
              autoComplete="current-password"
              className="flex-1 bg-transparent border-none outline-none font-mono text-[13.5px] text-text placeholder:text-text-dimmer"
              style={{ caretColor: "var(--color-accent)" }}
            />
          </div>

          {/* Error */}
          <div
            className={`font-mono text-[11px] text-red-400 transition-all duration-200 ${sudoError ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 pointer-events-none"}`}
          >
            ⚠&nbsp; {sudoError}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-hairline/60 px-5 py-2.5 flex justify-between items-center">
          <span className="font-mono text-[10px] text-text-dimmer">
            session · saved until tab closes
          </span>
          <button
            onClick={submitSudoPassword}
            disabled={!sudoPassword}
            className="font-mono text-[11px] px-3 py-1.5 rounded bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            enter ↵
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes slideUp   { from { opacity: 0; transform: translateY(24px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes slideDown { from { opacity: 1; transform: translateY(0) scale(1); } to { opacity: 0; transform: translateY(24px) scale(0.97); } }
        .animate-fadeIn   { animation: fadeIn   0.2s ease forwards; }
        .animate-fadeOut  { animation: fadeOut  0.2s ease forwards; }
        .animate-slideUp  { animation: slideUp  0.25s cubic-bezier(0.22,1,0.36,1) forwards; }
        .animate-slideDown{ animation: slideDown 0.2s cubic-bezier(0.22,1,0.36,1) forwards; }
      `}</style>
    </div>
  ) : null;

  // ── Chat mode ─────────────────────────────────────────────────────────────
  if (chatMode) {
    return (
      <>
        {SudoOverlay}
        <div data-modal-open className="fixed inset-0 z-30 flex items-center justify-center pointer-events-none">
          <div
            className={`absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto ${exiting ? "animate-fadeOut" : "animate-fadeIn"}`}
            onClick={exitChat}
          />
          <div
            className={`relative pointer-events-auto w-full max-w-2xl mx-4 flex flex-col rounded-xl border border-accent/40 bg-surface-2/97 backdrop-blur-md shadow-2xl shadow-black/60 ${exiting ? "animate-slideDown" : "animate-slideUp"}`}
            style={{ maxHeight: "min(680px, 85vh)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-hairline/60 px-5 py-3 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-green animate-pulse" aria-hidden />
                  <span className="font-mono text-[13px] text-green">
                    Zhong86<span className="text-accent">:~$</span>{" "}
                    <span className="text-text-dimmer">ask anything - coding, work or even hobbies</span>
                  </span>
                </div>
                <button
                  onClick={exitChat}
                  className="font-mono text-[11px] text-text-dimmer hover:text-accent transition-colors px-2 py-1 rounded hover:bg-surface-3/60"
                >
                  esc · exit
                </button>
              </div>
              {messages.length !== 0 && (
                <p className="font-mono text-[10px] text-text-dimmer text-left leading-relaxed">
                  Session only - messages won't be saved.
                </p>
              )}
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0">
              {messages.length === 0 && !streaming && (
                <div className="flex items-center justify-center h-full">
                  <p className="font-mono text-[12px] text-text-dimmer text-center leading-relaxed">
                    <span className="text-accent/60">Session only - messages won't be saved.</span>
                  </p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <span className={`font-mono text-[10px] shrink-0 mt-1 ${msg.role === "user" ? "text-accent" : "text-green"}`}>
                    {msg.role === "user" ? "you" : "talos"}
                  </span>
                  <div className={`max-w-[85%] rounded-lg px-3.5 py-2.5 font-mono text-[13px] leading-relaxed whitespace-pre-wrap break-words ${msg.role === "user" ? "bg-accent/10 text-text border border-accent/20" : "bg-surface-3/60 text-text border border-hairline/40"}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {streaming && (
                <div className="flex gap-3 flex-row">
                  <span className="font-mono text-[10px] shrink-0 mt-1 text-green">talos</span>
                  <div className="max-w-[85%] rounded-lg px-3.5 py-2.5 bg-surface-3/60 border border-hairline/40 font-mono text-[13px] leading-relaxed text-text whitespace-pre-wrap break-words">
                    {streamingText || (
                      <span className="inline-flex gap-1 items-center">
                        <span className="w-1 h-1 rounded-full bg-accent animate-bounce [animation-delay:0ms]" />
                        <span className="w-1 h-1 rounded-full bg-accent animate-bounce [animation-delay:150ms]" />
                        <span className="w-1 h-1 rounded-full bg-accent animate-bounce [animation-delay:300ms]" />
                      </span>
                    )}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="shrink-0 border-t border-hairline/60 px-5 py-3 flex items-center gap-3">
              <span className="font-mono text-[13px] text-accent shrink-0">›</span>
              <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder={streaming ? "Talos is thinking…" : "type a message · esc to exit"}
                autoComplete="off"
                spellCheck={false}
                className="flex-1 bg-transparent border-none outline-none font-mono text-[13.5px] text-text placeholder:text-text-dimmer disabled:opacity-40"
                style={{ caretColor: "var(--color-accent)" }}
              />
            </div>
          </div>
          <style>{`
            @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
            @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
            @keyframes slideUp   { from { opacity: 0; transform: translateY(24px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
            @keyframes slideDown { from { opacity: 1; transform: translateY(0) scale(1); } to { opacity: 0; transform: translateY(24px) scale(0.97); } }
            .animate-fadeIn   { animation: fadeIn   0.2s ease forwards; }
            .animate-fadeOut  { animation: fadeOut  0.2s ease forwards; }
            .animate-slideUp  { animation: slideUp  0.25s cubic-bezier(0.22,1,0.36,1) forwards; }
            .animate-slideDown{ animation: slideDown 0.2s cubic-bezier(0.22,1,0.36,1) forwards; }
          `}</style>
        </div>
      </>
    );
  }

  // ── Normal terminal bar ────────────────────────────────────────────────────
  return (
    <>
      {SudoOverlay}
      <div className="fixed bottom-15 left-0 md:left-[max(250px,calc((100vw-1180px)/2+140px))] right-0 px-4 md:pr-14 z-20 pointer-events-none">
        <div className="max-w-[760px] mx-auto pointer-events-auto relative">
          {/* Palette */}
          <div
            className={`absolute bottom-full left-0 right-0 mb-2 rounded-lg border border-hairline bg-surface-2/97 backdrop-blur-md shadow-xl shadow-black/50 overflow-hidden transition-all duration-150 origin-bottom ${showPalette ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-1 pointer-events-none"}`}
          >
            <div className="px-4 py-2 border-b border-hairline/60 font-mono text-[10px] text-text-dimmer uppercase tracking-wide flex justify-between">
              <span>Commands</span>
              <span>↑↓ select · tab fill · enter go</span>
            </div>
            <div ref={listRef} className="max-h-52 overflow-y-auto py-1">
              {filtered.map((item, i) => (
                <button
                  key={item.cmd}
                  type="button"
                  data-sfx="move"
                  onMouseDown={(e) => { e.preventDefault(); runCommand(item.cmd); setValue(""); }}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-2 font-mono text-[13px] text-left transition-colors ${i === activeIndex ? "bg-accent/15 text-accent" : "text-text hover:bg-surface-3/60"}`}
                >
                  <span className="shrink-0 flex items-center gap-2">
                    {item.cmd}
                    {item.cmd === "sudo" && sudoUnlocked && (
                      <span className="text-[9px] text-green border border-green/30 px-1 rounded">unlocked</span>
                    )}
                  </span>
                  <span className="text-text-dimmer text-[11px] truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Terminal bar */}
          <div
            className={`rounded-lg border bg-surface-2/95 backdrop-blur-md transition-all duration-300 ${attention ? "border-accent shadow-[0_0_0_1px_var(--color-accent),0_0_24px_4px_rgba(var(--color-accent-rgb,255,153,0),0.35)] animate-terminal-attention" : focused ? "border-accent/70 shadow-[0_0_0_1px_var(--color-accent),0_0_20px_2px_rgba(var(--color-accent-rgb,255,153,0),0.2)]" : "border-hairline shadow-lg shadow-black/40"}`}
          >
            <div
              className={`px-4 md:px-6 font-mono text-xs text-accent border-b border-hairline/60 transition-all duration-150 overflow-hidden ${error ? "max-h-10 py-2 opacity-100" : "max-h-0 py-0 opacity-0 border-b-0"}`}
            >
              {error}
            </div>
            <div className="flex items-center h-12 gap-2.5 px-4 md:px-6">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${focused ? "bg-green animate-pulse" : "bg-text-dimmer"}`}
                aria-hidden
              />
              <span className="font-mono text-[13px] text-green shrink-0 whitespace-nowrap">
                Zhong86<span className="text-accent">:~$</span>
                {sudoUnlocked && <span className="ml-1 text-[10px] text-green/60">#</span>}
              </span>
              <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Try typing..."
                autoComplete="off"
                spellCheck={false}
                onKeyDown={handleKeyDown}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                className="flex-1 bg-transparent border-none outline-none font-mono text-[13.5px] text-text placeholder:text-text-dimmer"
                style={{ caretColor: "var(--color-accent)" }}
              />
              <span className="hidden lg:block font-mono text-[11px] text-text-dimmer shrink-0">
                {focused ? "try: cd projects" : "press / to focus"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
