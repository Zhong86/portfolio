"use client";

import { useEffect, useState } from "react";
import { DEFAULT_REMINDER, type Reminder } from "@/lib/config";
import { sudoHeaders, sudoToken } from "@/lib/use-sudo";

/** "how long ago" in the same terse register as the rest of the page. */
function sinceLabel(iso: string, now: number): string {
  const diff = now - new Date(iso).getTime();
  if (!Number.isFinite(diff) || diff < 0) return "just now";
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "yesterday" : `${days}d ago`;
}

export default function ReminderHeadline() {
  const [reminder, setReminder] = useState<Reminder | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSudo, setIsSudo] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);
  // Stays null until mounted so server and first client render match.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setIsSudo(localStorage.getItem("sudoUnlocked") === "true");
    const handler = () => setIsSudo(localStorage.getItem("sudoUnlocked") === "true");
    window.addEventListener("sudo-unlocked", handler);

    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 60000);

    fetch("/api/reminder", { headers: sudoHeaders() })
      .then((res) => (res.ok ? res.json() : { reminder: null }))
      .then((data) => setReminder(data.reminder ?? null))
      .catch(() => setError("Failed to load reminder."))
      .finally(() => setLoading(false));

    return () => {
      window.removeEventListener("sudo-unlocked", handler);
      clearInterval(interval);
    };
  }, []);

  // The "permission denied" nudge is transient — it clears itself.
  useEffect(() => {
    if (!denied) return;
    const timeout = setTimeout(() => setDenied(false), 2500);
    return () => clearTimeout(timeout);
  }, [denied]);

  function startEditing() {
    if (editing || loading) return;
    // Pressable for everyone, but without sudo it just says no — the editor
    // never opens (and the API would 401 anyway).
    if (!isSudo) {
      setDenied(true);
      return;
    }
    setDraft(reminder?.text ?? "");
    setError(null);
    setEditing(true);
  }

  async function save() {
    const text = draft.trim();
    if (!text) return;

    setSaving(true);
    try {
      const res = await fetch("/api/reminder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-sudo-token": sudoToken(),
        },
        body: JSON.stringify({ text }),
      });
      if (res.status === 401) {
        setError("Sudo session expired — run sudo in the terminal again.");
        return;
      }
      if (!res.ok) {
        setError("Save failed.");
        return;
      }
      const data = await res.json();
      setReminder(data.reminder);
      setNow(Date.now());
      setEditing(false);
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  /** Drops the KV entry so the card falls back to DEFAULT_REMINDER. */
  async function resetToDefault() {
    try {
      const res = await fetch("/api/reminder", {
        method: "DELETE",
        headers: { "x-sudo-token": sudoToken() },
      });
      if (!res.ok) {
        setError(res.status === 401 ? "Sudo session expired." : "Reset failed.");
        return;
      }
      setReminder(null);
      setEditing(false);
    } catch {
      setError("Network error.");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") setEditing(false);
    // Ctrl/Cmd+Enter saves, so the textarea keeps plain Enter for newlines.
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save();
  }

  const text = reminder?.text ?? DEFAULT_REMINDER;
  const stamp = reminder
    ? now === null
      ? ""
      : sinceLabel(reminder.updatedAt, now)
    : "default";

  const clickable = !editing && !loading;

  return (
    <div
      onClick={startEditing}
      className={`mb-8 border border-accent/50 rounded-md bg-surface overflow-hidden transition-all duration-200 ${clickable
        ? "cursor-pointer hover:border-accent/80 hover:shadow-[0_0_0_1px_var(--color-accent),0_0_20px_2px_rgba(var(--color-accent-rgb,255,153,0),0.2)]"
        : ""
        }`}
    >
      <div className="px-4 py-2.5 border-b border-accent/25 font-mono text-[11px] text-text-dimmer flex justify-between items-center">
        <span className="text-text-dim">reminder.txt</span>
        <span className={denied ? "text-accent" : ""}>
          {denied
            ? "sudo: permission denied"
            : clickable && isSudo
              ? "click to edit"
              : stamp}
        </span>
      </div>

      <div className="px-5 py-6">
        <div className="font-mono text-[11px] text-text-dimmer uppercase tracking-wide mb-2">
          reminder
        </div>

        {error && <div className="mb-3 font-mono text-[11.5px] text-accent">{error}</div>}

        {editing ? (
          <div className="flex flex-col gap-3" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
            <textarea
              autoFocus
              rows={2}
              value={draft}
              maxLength={200}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={DEFAULT_REMINDER}
              className="font-mono text-[18px] sm:text-[22px] leading-snug text-text bg-surface-2 border border-hairline rounded-md px-3 py-2 outline-none focus:border-accent/60 transition-colors resize-none placeholder:text-text-dimmer"
            />
            <div className="flex items-center justify-between font-mono text-[11.5px]">
              {reminder ? (
                <button
                  onClick={resetToDefault}
                  className="text-text-dimmer hover:text-accent transition-colors"
                >
                  reset to default
                </button>
              ) : (
                <span />
              )}
              <span className="flex items-center gap-3">
                <button
                  onClick={() => setEditing(false)}
                  className="text-text-dimmer hover:text-text transition-colors"
                >
                  esc · cancel
                </button>
                <button
                  onClick={save}
                  disabled={saving || !draft.trim()}
                  className="px-4 py-1.5 rounded bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {saving ? "saving…" : "save →"}
                </button>
              </span>
            </div>
          </div>
        ) : loading ? (
          <div className="h-[30px] w-2/3 rounded bg-surface-2 animate-pulse" />
        ) : (
          <p className="font-mono text-[20px] sm:text-[26px] leading-snug text-accent font-medium whitespace-pre-wrap">
            {text}
          </p>
        )}
      </div>
    </div>
  );
}
