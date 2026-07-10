"use client";

import { useEffect, useState, useRef } from "react";

type ToolEntry = {
  slug: string;
  title: string;
  description: string;
  url: string;
};

function sudoToken(): string {
  return sessionStorage.getItem("sudoToken") ?? "";
}

function faviconFor(url: string) {
  try {
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=64`;
  } catch {
    return null;
  }
}

function ToolCard({
  tool,
  isSudo,
  onDelete,
  onEdit,
}: {
  tool: ToolEntry;
  isSudo: boolean;
  onDelete: (slug: string) => void;
  onEdit: (tool: ToolEntry) => void;
}) {
  const favicon = faviconFor(tool.url);

  return (
    <div className="border border-hairline rounded-md bg-surface hover:bg-surface-2 transition-colors group relative">
      <a
        href={tool.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-start gap-3 px-4 py-3.5"
      >
        <div className="w-6 h-6 rounded shrink-0 mt-0.5 flex items-center justify-center bg-surface-2 border border-hairline overflow-hidden">
          {favicon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={favicon} alt="" className="w-4 h-4" />
          ) : (
            <span className="font-mono text-[10px] text-text-dimmer">•</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="font-mono text-[13px] text-text truncate">
            {tool.title}
          </div>
          {tool.description && (
            <div className="font-mono text-[11px] text-text-dimmer mt-0.5 line-clamp-2">
              {tool.description}
            </div>
          )}
        </div>

        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12" height="12"
          viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          className="text-text-dimmer shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <path d="M7 17L17 7M7 7h10v10" />
        </svg>
      </a>

      {isSudo && (
        <div
          style={{ position: "absolute", top: "8px", right: "8px", display: "flex", alignItems: "center", gap: "8px" }}
        >
          <span
            role="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(tool); }}
            style={{ paddingLeft: "8px", paddingRight: "8px", paddingTop: "2px", paddingBottom: "2px" }}
            className="font-mono text-[10px] rounded border border-hairline bg-surface text-text-dimmer hover:text-accent hover:border-accent transition-colors cursor-pointer"
          >
            edit
          </span>
          <span
            role="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(tool.slug); }}
            style={{ paddingLeft: "8px", paddingRight: "8px", paddingTop: "2px", paddingBottom: "2px" }}
            className="font-mono text-[10px] rounded border border-hairline bg-surface text-text-dimmer hover:text-accent hover:border-accent transition-colors cursor-pointer"
          >
            del
          </span>
        </div>
      )}
    </div>
  );
}

function ToolEditorModal({
  initial,
  onSave,
  onClose,
  saving,
}: {
  initial?: ToolEntry;
  onSave: (title: string, description: string, url: string) => Promise<void>;
  onClose: () => void;
  saving: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") onClose();
  }

  function isValidUrl(value: string) {
    try {
      const u = new URL(value);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }

  const canSave = title.trim() && isValidUrl(url.trim());

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-md mx-4 flex flex-col gap-3 rounded-xl border border-accent/40 bg-surface-2/97 backdrop-blur-md shadow-2xl shadow-black/60"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="border-b border-hairline/60 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span className="font-mono text-[13px] text-text-dim">
              {initial ? `editing · ${initial.slug}` : "new tool link"}
            </span>
          </div>
          <button onClick={onClose} className="font-mono text-[11px] text-text-dimmer hover:text-accent transition-colors">
            esc · cancel
          </button>
        </div>

        <div className="px-5 pt-1 flex flex-col gap-1.5">
          <span className="font-mono text-[11px] text-text-dimmer uppercase tracking-wide">title</span>
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Excalidraw"
            className="font-mono text-[13px] text-text bg-surface border border-hairline rounded px-3 py-1.5 outline-none focus:border-accent/60 transition-colors"
          />
        </div>

        <div className="px-5 flex flex-col gap-1.5">
          <span className="font-mono text-[11px] text-text-dimmer uppercase tracking-wide">url</span>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="font-mono text-[13px] text-text bg-surface border border-hairline rounded px-3 py-1.5 outline-none focus:border-accent/60 transition-colors"
          />
        </div>

        <div className="px-5 pb-5 flex flex-col gap-1.5">
          <span className="font-mono text-[11px] text-text-dimmer uppercase tracking-wide">description</span>
          <textarea
            value={description}
            rows={3}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this tool for..."
            className="font-mono text-[12.5px] text-text bg-surface border border-hairline rounded-md px-3 py-2 leading-relaxed outline-none focus:border-accent/50 transition-colors resize-none placeholder:text-text-dimmer"
          />
        </div>

        <div className="border-t border-hairline/60 px-5 py-3 flex justify-end items-center">
          <button
            onClick={() => onSave(title.trim(), description.trim(), url.trim())}
            disabled={saving || !canSave}
            className="font-mono text-[12px] px-4 py-1.5 rounded bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {saving ? "saving…" : "save →"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ToolLinks() {
  const [tools, setTools] = useState<ToolEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSudo, setIsSudo] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTool, setEditingTool] = useState<ToolEntry | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsSudo(sessionStorage.getItem("sudoUnlocked") === "true");
    const handler = () => setIsSudo(sessionStorage.getItem("sudoUnlocked") === "true");
    window.addEventListener("sudo-unlocked", handler);
    return () => window.removeEventListener("sudo-unlocked", handler);
  }, []);

  async function fetchTools() {
    setLoading(true);
    try {
      const res = await fetch("/api/tools");
      const data = await res.json();
      setTools(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to load tools.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchTools(); }, []);

  async function handleSave(title: string, description: string, url: string) {
    setSaving(true);
    try {
      const isEdit = !!editingTool;
      const res = await fetch("/api/tools", {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          "x-sudo-token": sudoToken(),
        },
        body: JSON.stringify(
          isEdit ? { slug: editingTool!.slug, title, description, url } : { title, description, url }
        ),
      });
      if (res.status === 401) {
        setError("Sudo session expired — run sudo in the terminal again.");
        return;
      }
      if (!res.ok) { setError("Save failed."); return; }
      setShowEditor(false);
      setEditingTool(undefined);
      await fetchTools();
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(slug: string) {
    if (!confirm(`Delete this tool link?`)) return;
    try {
      const res = await fetch("/api/tools", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-sudo-token": sudoToken(),
        },
        body: JSON.stringify({ slug }),
      });
      if (res.status === 401) { setError("Sudo session expired."); return; }
      if (!res.ok) { setError("Delete failed."); return; }
      await fetchTools();
    } catch {
      setError("Network error.");
    }
  }

  return (
    <div>
      {isSudo && (
        <div className="flex items-center justify-between mb-7">
          <button
            onClick={() => { setEditingTool(undefined); setShowEditor(true); }}
            className="font-mono text-[12px] px-3.5 py-1.5 rounded border border-accent/40 bg-accent/10 text-accent hover:bg-accent/20 transition-colors ml-auto"
          >
            + new tool
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 border border-accent/30 rounded-md px-4 py-2.5 bg-accent/5 font-mono text-[12px] text-accent flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-text-dimmer hover:text-text ml-4 text-lg leading-none">×</button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[64px] border border-hairline rounded-md bg-surface animate-pulse" />
          ))}
        </div>
      ) : tools.length === 0 ? (
        <p className="font-mono text-[12px] text-center text-text-dimmer">no tools yet</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {tools.map((tool) => (
            <ToolCard
              key={tool.slug}
              tool={tool}
              isSudo={isSudo}
              onDelete={handleDelete}
              onEdit={(t) => { setEditingTool(t); setShowEditor(true); }}
            />
          ))}
        </div>
      )}

      {showEditor && (
        <ToolEditorModal
          initial={editingTool}
          onSave={handleSave}
          onClose={() => { setShowEditor(false); setEditingTool(undefined); }}
          saving={saving}
        />
      )}
    </div>
  );
}
