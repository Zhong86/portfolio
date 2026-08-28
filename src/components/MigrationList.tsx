"use client";

import { Migration } from "@/lib/config";
import { useEffect, useState, useRef } from "react";

function sudoToken(): string {
  return localStorage.getItem("sudoToken") ?? "";
}

function parseLinksInput(raw: string): { label: string; href: string }[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, ...rest] = line.split("|");
      return { label: label.trim(), href: rest.join("|").trim() };
    })
    .filter((l) => l.label && l.href);
}

function linksToInput(links: { label: string; href: string }[]): string {
  return links.map((l) => `${l.label}|${l.href}`).join("\n");
}

function MigrationItem({
  migration,
  isSudo,
  onDelete,
  onEdit,
}: {
  migration: Migration;
  isSudo: boolean;
  onDelete: (id: string) => void;
  onEdit: (migration: Migration) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-hairline rounded-md mb-3.5 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex justify-between items-center px-4.5 py-4 bg-surface hover:bg-surface-2 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-mono text-xs text-text-dimmer shrink-0">{migration.num}</span>
          <span className="font-mono text-sm text-text truncate">{migration.title}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {isSudo && (
            <>
              <span
                role="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(migration);
                }}
                className="font-mono text-[10px] px-2 py-0.5 rounded border border-hairline text-text-dimmer hover:text-blue hover:border-blue transition-colors cursor-pointer"
              >
                edit
              </span>
              <span
                role="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(migration.id);
                }}
                className="font-mono text-[10px] px-2 py-0.5 rounded border border-hairline text-text-dimmer hover:text-accent hover:border-accent transition-colors cursor-pointer"
              >
                del
              </span>
            </>
          )}
          <span
            className={`font-mono text-[11px] font-semibold px-2 py-0.5 rounded ${
              migration.status === "PROD" ? "bg-accent-dim text-accent" : "bg-hairline text-text-dim"
            }`}
          >
            {migration.status}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`text-text-dimmer transition-transform duration-200 shrink-0 ${open ? "rotate-180" : ""}`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </button>
      {open && (
        <div className="px-4.5 pb-4.5 border-t border-hairline bg-surface">
          <p className="font-sans text-sm text-text-dim my-4 max-w-[600px]">{migration.description}</p>
          <div className="flex gap-2 flex-wrap mt-3">
            {migration.stack.map((tag) => (
              <span key={tag} className="font-mono text-[11.5px] px-2.5 py-1 border border-hairline rounded text-text-dim">
                {tag}
              </span>
            ))}
          </div>
          <div className="flex gap-4 mt-4 font-mono text-[12.5px]">
            {migration.links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue hover:text-accent"
              >
                → {link.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectEditorModal({
  initial,
  onSave,
  onClose,
  saving,
}: {
  initial?: Migration;
  onSave: (data: {
    title: string;
    status: "PROD" | "ARCHIVED";
    description: string;
    stack: string[];
    links: { label: string; href: string }[];
  }) => Promise<void>;
  onClose: () => void;
  saving: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [status, setStatus] = useState<"PROD" | "ARCHIVED">(initial?.status ?? "PROD");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [stackInput, setStackInput] = useState(initial?.stack.join(", ") ?? "");
  const [linksInput, setLinksInput] = useState(initial ? linksToInput(initial.links) : "");
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") onClose();
  }

  const canSave = title.trim() && description.trim();

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-2xl mx-4 flex flex-col gap-3 rounded-xl border border-accent/40 bg-surface-2/97 backdrop-blur-md shadow-2xl shadow-black/60"
        style={{ maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="border-b border-hairline/60 px-5 py-3 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span className="font-mono text-[13px] text-text-dim">
              {initial ? `editing · ${initial.num} ${initial.title}` : "new project"}
            </span>
          </div>
          <button onClick={onClose} className="font-mono text-[11px] text-text-dimmer hover:text-accent transition-colors">
            esc · cancel
          </button>
        </div>

        <div className="px-5 pt-1 pb-2 overflow-y-auto flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[11px] text-text-dimmer uppercase tracking-wide">title</span>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Orchestrator Agent"
              className="font-mono text-[13px] text-text bg-surface border border-hairline rounded px-3 py-1.5 outline-none focus:border-accent/60 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[11px] text-text-dimmer uppercase tracking-wide">status</span>
            <div className="flex gap-1.5">
              {(["PROD", "ARCHIVED"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`font-mono text-[11px] px-3 py-1 rounded transition-colors ${
                    status === s
                      ? "bg-accent/15 text-accent border border-accent/30"
                      : "text-text-dimmer hover:text-text border border-hairline"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[11px] text-text-dimmer uppercase tracking-wide">description</span>
            <textarea
              value={description}
              rows={4}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this project and what did you build..."
              className="font-mono text-[12.5px] text-text bg-surface border border-hairline rounded-md px-3 py-2 leading-relaxed outline-none focus:border-accent/50 transition-colors resize-none placeholder:text-text-dimmer"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[11px] text-text-dimmer uppercase tracking-wide">stack (comma separated)</span>
            <input
              type="text"
              value={stackInput}
              onChange={(e) => setStackInput(e.target.value)}
              placeholder="Python, LangGraph"
              className="font-mono text-[13px] text-text bg-surface border border-hairline rounded px-3 py-1.5 outline-none focus:border-accent/60 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[11px] text-text-dimmer uppercase tracking-wide">links (one per line, label|url)</span>
            <textarea
              value={linksInput}
              rows={3}
              onChange={(e) => setLinksInput(e.target.value)}
              placeholder={"source_docs|https://example.com\nwebsite|https://example.com"}
              className="font-mono text-[12.5px] text-text bg-surface border border-hairline rounded-md px-3 py-2 leading-relaxed outline-none focus:border-accent/50 transition-colors resize-none placeholder:text-text-dimmer"
            />
          </div>
        </div>

        <div className="border-t border-hairline/60 px-5 py-3 shrink-0 flex justify-end items-center">
          <button
            onClick={() =>
              onSave({
                title: title.trim(),
                status,
                description: description.trim(),
                stack: stackInput
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
                links: parseLinksInput(linksInput),
              })
            }
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

export default function MigrationList() {
  const [projects, setProjects] = useState<Migration[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSudo, setIsSudo] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingProject, setEditingProject] = useState<Migration | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsSudo(localStorage.getItem("sudoUnlocked") === "true");
    const handler = () => setIsSudo(localStorage.getItem("sudoUnlocked") === "true");
    window.addEventListener("sudo-unlocked", handler);
    return () => window.removeEventListener("sudo-unlocked", handler);
  }, []);

  async function fetchProjects() {
    setLoading(true);
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to load projects.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProjects();
  }, []);

  async function handleSave(data: {
    title: string;
    status: "PROD" | "ARCHIVED";
    description: string;
    stack: string[];
    links: { label: string; href: string }[];
  }) {
    setSaving(true);
    try {
      const isEdit = !!editingProject;
      const res = await fetch("/api/projects", {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          "x-sudo-token": sudoToken(),
        },
        body: JSON.stringify(isEdit ? { id: editingProject!.id, ...data } : data),
      });
      if (res.status === 401) {
        setError("Sudo session expired — run sudo in the terminal again.");
        return;
      }
      if (!res.ok) {
        setError("Save failed.");
        return;
      }
      setShowEditor(false);
      setEditingProject(undefined);
      await fetchProjects();
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this project?")) return;
    try {
      const res = await fetch("/api/projects", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-sudo-token": sudoToken(),
        },
        body: JSON.stringify({ id }),
      });
      if (res.status === 401) {
        setError("Sudo session expired.");
        return;
      }
      if (!res.ok) {
        setError("Delete failed.");
        return;
      }
      await fetchProjects();
    } catch {
      setError("Network error.");
    }
  }

  return (
    <div>
      {isSudo && (
        <div className="flex items-center justify-between mb-3.5">
          <button
            onClick={() => {
              setEditingProject(undefined);
              setShowEditor(true);
            }}
            className="font-mono text-[12px] px-3.5 py-1.5 rounded border border-accent/40 bg-accent/10 text-accent hover:bg-accent/20 transition-colors ml-auto"
          >
            + new project
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
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[56px] border border-hairline rounded-md bg-surface animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <p className="font-mono text-[12px] text-center text-text-dimmer">no projects yet</p>
      ) : (
        projects.map((m) => (
          <MigrationItem
            key={m.id}
            migration={m}
            isSudo={isSudo}
            onDelete={handleDelete}
            onEdit={(p) => {
              setEditingProject(p);
              setShowEditor(true);
            }}
          />
        ))
      )}

      {showEditor && (
        <ProjectEditorModal
          initial={editingProject}
          onSave={handleSave}
          onClose={() => {
            setShowEditor(false);
            setEditingProject(undefined);
          }}
          saving={saving}
        />
      )}
    </div>
  );
}
