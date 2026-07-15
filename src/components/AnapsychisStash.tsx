"use client";

import { useEffect, useState, useRef } from "react";

type StashEntry = {
  slug: string;
  label: string;
  note: string;
  url: string;
};

function sudoToken(): string {
  return sessionStorage.getItem("sudoToken") ?? "";
}

function LockedScreen() {
  return (
    <div className="border border-hairline rounded-md bg-surface px-6 py-10 flex flex-col items-center gap-3 text-center">
      <span className="font-mono text-[13px] text-accent">✗ permission denied</span>
      <p className="font-mono text-[12px] text-text-dimmer max-w-[380px] leading-relaxed">
        ~/anapsychis is a restricted path. run <span className="text-text-dim">sudo</span> in
        the terminal below to authenticate.
      </p>
    </div>
  );
}

function StashCard({
  entry,
  onDelete,
  onEdit,
}: {
  entry: StashEntry;
  onDelete: (slug: string) => void;
  onEdit: (entry: StashEntry) => void;
}) {
  return (
    <div className="border border-hairline rounded-md bg-surface hover:bg-surface-2 transition-colors group relative
      transition-all duration-200
      hover:border-accent/70
    hover:shadow-[0_0_0_1px_var(--color-accent),0_0_20px_2px_rgba(var(--color-accent-rgb,255,153,0),0.2)]
    ">
      <a
        href={entry.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-start gap-3 px-4 py-3.5 pr-20"
      >
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[13px] text-text truncate">{entry.label}</div>
          {entry.note && (
            <div className="font-mono text-[11px] text-text-dimmer mt-0.5 line-clamp-2">
              {entry.note}
            </div>
          )}
          <div className="font-mono text-[10.5px] text-text-dimmer/70 mt-1 truncate">
            {entry.url}
          </div>
        </div>
      </a>

      <div
        style={{ position: "absolute", top: "8px", right: "8px", display: "flex", alignItems: "center", gap: "8px" }}
      >
        <span
          role="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(entry); }}
          style={{ paddingLeft: "8px", paddingRight: "8px", paddingTop: "2px", paddingBottom: "2px" }}
          className="font-mono text-[10px] rounded border border-hairline bg-surface text-text-dimmer hover:text-accent hover:border-accent transition-colors cursor-pointer"
        >
          edit
        </span>
        <span
          role="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(entry.slug); }}
          style={{ paddingLeft: "8px", paddingRight: "8px", paddingTop: "2px", paddingBottom: "2px" }}
          className="font-mono text-[10px] rounded border border-hairline bg-surface text-text-dimmer hover:text-accent hover:border-accent transition-colors cursor-pointer"
        >
          del
        </span>
      </div>
    </div>
  );
}

function StashEditorModal({
  initial,
  onSave,
  onClose,
  saving,
}: {
  initial?: StashEntry;
  onSave: (label: string, note: string, url: string) => Promise<void>;
  onClose: () => void;
  saving: boolean;
}) {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const labelRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    labelRef.current?.focus();
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

  const canSave = label.trim() && isValidUrl(url.trim());

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
              {initial ? `editing · ${initial.slug}` : "new stash entry"}
            </span>
          </div>
          <button onClick={onClose} className="font-mono text-[11px] text-text-dimmer hover:text-accent transition-colors">
            esc · cancel
          </button>
        </div>

        <div className="px-5 pt-1 flex flex-col gap-1.5">
          <span className="font-mono text-[11px] text-text-dimmer uppercase tracking-wide">label</span>
          <input
            ref={labelRef}
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. watch later"
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
          <span className="font-mono text-[11px] text-text-dimmer uppercase tracking-wide">note</span>
          <textarea
            value={note}
            rows={3}
            onChange={(e) => setNote(e.target.value)}
            placeholder="why you saved this..."
            className="font-mono text-[12.5px] text-text bg-surface border border-hairline rounded-md px-3 py-2 leading-relaxed outline-none focus:border-accent/50 transition-colors resize-none placeholder:text-text-dimmer"
          />
        </div>

        <div className="border-t border-hairline/60 px-5 py-3 flex justify-end items-center">
          <button
            onClick={() => onSave(label.trim(), note.trim(), url.trim())}
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

export default function AnapsychisStash() {
  const [entries, setEntries] = useState<StashEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSudo, setIsSudo] = useState<boolean | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingEntry, setEditingEntry] = useState<StashEntry | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const check = () => setIsSudo(sessionStorage.getItem("sudoUnlocked") === "true");
    check();
    window.addEventListener("sudo-unlocked", check);
    return () => window.removeEventListener("sudo-unlocked", check);
  }, []);

  async function fetchEntries() {
    setLoading(true);
    try {
      const res = await fetch("/api/anapsychis", {
        headers: { "x-sudo-token": sudoToken() },
      });
      if (res.status === 401) {
        setIsSudo(false);
        return;
      }
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to load stash.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isSudo) fetchEntries();
  }, [isSudo]);

  async function handleSave(label: string, note: string, url: string) {
    setSaving(true);
    try {
      const isEdit = !!editingEntry;
      const res = await fetch("/api/anapsychis", {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          "x-sudo-token": sudoToken(),
        },
        body: JSON.stringify(
          isEdit ? { slug: editingEntry!.slug, label, note, url } : { label, note, url }
        ),
      });
      if (res.status === 401) {
        setError("Sudo session expired — run sudo in the terminal again.");
        return;
      }
      if (!res.ok) { setError("Save failed."); return; }
      setShowEditor(false);
      setEditingEntry(undefined);
      await fetchEntries();
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(slug: string) {
    if (!confirm("Delete this entry?")) return;
    try {
      const res = await fetch("/api/anapsychis", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-sudo-token": sudoToken(),
        },
        body: JSON.stringify({ slug }),
      });
      if (res.status === 401) { setError("Sudo session expired."); return; }
      if (!res.ok) { setError("Delete failed."); return; }
      await fetchEntries();
    } catch {
      setError("Network error.");
    }
  }

  // Avoid a locked-screen flash before sessionStorage has been checked on mount.
  if (isSudo === null) return null;

  if (!isSudo) return <LockedScreen />;

  return (
    <div>
      <div className="flex items-center justify-between mb-7">
        <button
          onClick={() => { setEditingEntry(undefined); setShowEditor(true); }}
          className="font-mono text-[12px] px-3.5 py-1.5 rounded border border-accent/40 bg-accent/10 text-accent hover:bg-accent/20 transition-colors ml-auto"
        >
          + new entry
        </button>
      </div>

      {error && (
        <div className="mb-4 border border-accent/30 rounded-md px-4 py-2.5 bg-accent/5 font-mono text-[12px] text-accent flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-text-dimmer hover:text-text ml-4 text-lg leading-none">×</button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[72px] border border-hairline rounded-md bg-surface animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="font-mono text-[12px] text-center text-text-dimmer">stash is empty</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {entries.map((entry) => (
            <StashCard
              key={entry.slug}
              entry={entry}
              onDelete={handleDelete}
              onEdit={(e) => { setEditingEntry(e); setShowEditor(true); }}
            />
          ))}
        </div>
      )}

      {showEditor && (
        <StashEditorModal
          initial={editingEntry}
          onSave={handleSave}
          onClose={() => { setShowEditor(false); setEditingEntry(undefined); }}
          saving={saving}
        />
      )}
    </div>
  );
}
