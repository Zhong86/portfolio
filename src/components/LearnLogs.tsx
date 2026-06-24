"use client";

import { useEffect, useState, useRef } from "react";
import MarkdownRenderer from "@/components/MarkdownRenderer";

type LogEntry = {
  slug: string;
  date: string;
  title: string;
  content: string;
};

function formatDisplayDate(slug: string) {
  const d = new Date(slug + "T00:00:00Z");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function sudoToken(): string {
  return sessionStorage.getItem("sudoToken") ?? "";
}

function LogCard({
  log,
  isSudo,
  onDelete,
  onEdit,
}: {
  log: LogEntry;
  isSudo: boolean;
  onDelete: (slug: string) => void;
  onEdit: (log: LogEntry) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-hairline rounded-md overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex justify-between items-center px-4 py-3.5 bg-surface hover:bg-surface-2 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0 ">
          <span className="font-mono text-[11px] text-text-dimmer shrink-0">{log.date}</span>

          <span className="font-mono text-[13px] text-text whitespace-nowrap overflow-x-auto scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {log.title || formatDisplayDate(log.slug)}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-3">
          {isSudo && (
            <>
              <span
                role="button"
                onClick={(e) => { e.stopPropagation(); onEdit(log); }}
                className="font-mono text-[10px] px-2 py-0.5 rounded border border-hairline text-text-dimmer hover:text-blue hover:border-blue transition-colors cursor-pointer"
              >
                edit
              </span>
              <span
                role="button"
                onClick={(e) => { e.stopPropagation(); onDelete(log.slug); }}
                className="font-mono text-[10px] px-2 py-0.5 rounded border border-hairline text-text-dimmer hover:text-accent hover:border-accent transition-colors cursor-pointer"
              >
                del
              </span>
            </>
          )}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14" height="14"
            viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            className={`text-text-dimmer transition-transform duration-200 shrink-0 ${open ? "rotate-180" : ""}`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="px-5 py-4 border-t border-hairline bg-surface">
          <MarkdownRenderer content={log.content} />
        </div>
      )}
    </div>
  );
}

function EditorModal({
  initial,
  onSave,
  onClose,
  saving,
}: {
  initial?: LogEntry;
  onSave: (date: string, title: string, content: string) => Promise<void>;
  onClose: () => void;
  saving: boolean;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [date] = useState(initial?.date ?? today);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [tab, setTab] = useState<"write" | "preview">("write");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (tab === "write") textareaRef.current?.focus();
  }, [tab]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Tab" && tab === "write") {
      e.preventDefault();
      const ta = textareaRef.current!;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const next = content.slice(0, start) + "  " + content.slice(end);
      setContent(next);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
    if (e.key === "Escape") onClose();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-2xl mx-4 flex flex-col gap-3 rounded-xl border border-accent/40 bg-surface-2/97 backdrop-blur-md shadow-2xl shadow-black/60"
        style={{ maxHeight: "90vh", minHeight: "500px" }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="border-b border-hairline/60 px-5 py-3 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span className="font-mono text-[13px] text-text-dim">
              {initial ? `editing · ${initial.slug}` : "new log entry"}
            </span>
          </div>
          <button onClick={onClose} className="font-mono text-[11px] text-text-dimmer hover:text-accent transition-colors">
            esc · cancel
          </button>
        </div>

        <div className="px-5 pt-1 pb-3 shrink-0 flex items-center gap-3">
          <span className="font-mono text-[11px] text-text-dimmer uppercase tracking-wide shrink-0">title</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What I learned today..."
            className="font-mono text-[13px] text-text bg-surface border border-hairline rounded px-3 py-1.5 outline-none focus:border-accent/60 transition-colors flex-1"
          />
        </div>

        <div className="px-5 pb-3 shrink-0 flex gap-1.5">
          {(["write", "preview"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`font-mono text-[11px] px-3 py-1 rounded transition-colors ${tab === t
                ? "bg-accent/15 text-accent border border-accent/30"
                : "text-text-dimmer hover:text-text border border-transparent"
                }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 px-5 pb-4">
          {tab === "write" ? (
            <textarea
              ref={textareaRef}
              value={content}
              rows={10}
              onChange={(e) => setContent(e.target.value)}
              placeholder={"# What I learned today\n\nWrite your notes in **markdown**...\n\n## Topics\n- item one\n- item two\n\n```js\nconsole.log('hello');\n```"}
              className="w-full h-full min-h-[280px] bg-surface border border-hairline rounded-md px-4 py-3 font-mono text-[12.5px] text-text leading-relaxed outline-none focus:border-accent/50 transition-colors resize-none placeholder:text-text-dimmer"
              style={{ caretColor: "var(--color-accent)" }}
            />
          ) : (
            <div className="h-full min-h-[280px] overflow-y-auto bg-surface border border-hairline rounded-md px-5 py-4">
              {content.trim() ? (
                <MarkdownRenderer content={content} />
              ) : (
                <p className="font-mono text-[12px] text-text-dimmer italic">Nothing to preview yet.</p>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-hairline/60 px-5 py-3 shrink-0 flex justify-between items-center">
          <span className="font-mono text-[10px] text-text-dimmer">
            **bold** *italic* `code` # headings — lists
          </span>
          <button
            onClick={() => onSave(date, title, content)}
            disabled={saving || !content.trim() || !date}
            className="font-mono text-[12px] px-4 py-1.5 rounded bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {saving ? "saving…" : "save →"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LearnLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSudo, setIsSudo] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingLog, setEditingLog] = useState<LogEntry | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsSudo(sessionStorage.getItem("sudoUnlocked") === "true");
  }, []);

  async function fetchLogs() {
    setLoading(true);
    try {
      const res = await fetch("/api/logs");
      const data = await res.json();
      console.log(data);
      setLogs(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to load logs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchLogs(); }, []);

  async function handleSave(date: string, title: string, content: string) {
    setSaving(true);
    try {
      const res = await fetch("/api/logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-sudo-token": sudoToken(),
        },
        body: JSON.stringify({ date, title, content }),
      });
      if (res.status === 401) {
        setError("Sudo session expired — run sudo in the terminal again.");
        return;
      }
      if (!res.ok) { setError("Save failed."); return; }
      setShowEditor(false);
      setEditingLog(undefined);
      await fetchLogs();
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(slug: string) {
    if (!confirm(`Delete log for ${slug}?`)) return;
    try {
      const res = await fetch("/api/logs", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-sudo-token": sudoToken(),
        },
        body: JSON.stringify({ slug }),
      });
      if (res.status === 401) { setError("Sudo session expired."); return; }
      if (!res.ok) { setError("Delete failed."); return; }
      await fetchLogs();
    } catch {
      setError("Network error.");
    }
  }

  return (
    <div>
      {isSudo && (
        <div className="flex items-center justify-between mb-7">
          <button
            onClick={() => { setEditingLog(undefined); setShowEditor(true); }}
            className="font-mono text-[12px] px-3.5 py-1.5 rounded border border-accent/40 bg-accent/10 text-accent hover:bg-accent/20 transition-colors ml-auto"
          >
            + new log
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 border border-accent/30 rounded-md px-4 py-2.5 bg-accent/5 font-mono text-[12px] text-accent flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-text-dimmer hover:text-text ml-4 text-lg leading-none">×</button>
        </div>
      )}

      <div className="max-h-[600px] overflow-y-auto scrollbar-none">
        {loading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[52px] border border-hairline rounded-md bg-surface animate-pulse" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <p className="font-mono text-[12px] text-center text-text-dimmer">no logs yet</p>
        ) : (
          <div className="flex flex-col gap-2">
            {logs.map((log) => (
              <LogCard
                key={log.slug}
                log={log}
                isSudo={isSudo}
                onDelete={handleDelete}
                onEdit={(l) => { setEditingLog(l); setShowEditor(true); }}
              />
            ))}
          </div>
        )}
      </div>

      {showEditor && (
        <EditorModal
          initial={editingLog}
          onSave={handleSave}
          onClose={() => { setShowEditor(false); setEditingLog(undefined); }}
          saving={saving}
        />
      )}
    </div>
  );
}
