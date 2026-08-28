"use client";

import { useEffect, useState, useRef } from "react";
import { AboutField } from "@/lib/config";

function sudoToken(): string {
  return localStorage.getItem("sudoToken") ?? "";
}

function FieldEditorModal({
  initial,
  onSave,
  onClose,
  saving,
}: {
  initial?: AboutField;
  onSave: (field: string, type: string, value: string) => Promise<void>;
  onClose: () => void;
  saving: boolean;
}) {
  const [field, setField] = useState(initial?.field ?? "");
  const [type, setType] = useState(initial?.type ?? "string");
  const [value, setValue] = useState(initial?.value ?? "");
  const fieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fieldRef.current?.focus();
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") onClose();
  }

  const canSave = field.trim() && type.trim() && value.trim();

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
              {initial ? `editing · ${initial.field}` : "new field"}
            </span>
          </div>
          <button onClick={onClose} className="font-mono text-[11px] text-text-dimmer hover:text-accent transition-colors">
            esc · cancel
          </button>
        </div>

        <div className="px-5 pt-1 flex flex-col gap-1.5">
          <span className="font-mono text-[11px] text-text-dimmer uppercase tracking-wide">field</span>
          <input
            ref={fieldRef}
            type="text"
            value={field}
            onChange={(e) => setField(e.target.value)}
            placeholder="e.g. roles"
            className="font-mono text-[13px] text-text bg-surface border border-hairline rounded px-3 py-1.5 outline-none focus:border-accent/60 transition-colors"
          />
        </div>

        <div className="px-5 flex flex-col gap-1.5">
          <span className="font-mono text-[11px] text-text-dimmer uppercase tracking-wide">type</span>
          <input
            type="text"
            value={type}
            onChange={(e) => setType(e.target.value)}
            placeholder="e.g. string[]"
            className="font-mono text-[13px] text-text bg-surface border border-hairline rounded px-3 py-1.5 outline-none focus:border-accent/60 transition-colors"
          />
        </div>

        <div className="px-5 pb-5 flex flex-col gap-1.5">
          <span className="font-mono text-[11px] text-text-dimmer uppercase tracking-wide">value</span>
          <textarea
            value={value}
            rows={3}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. Backend Developer, AI Agent Engineer"
            className="font-mono text-[12.5px] text-text bg-surface border border-hairline rounded-md px-3 py-2 leading-relaxed outline-none focus:border-accent/50 transition-colors resize-none placeholder:text-text-dimmer"
          />
        </div>

        <div className="border-t border-hairline/60 px-5 py-3 flex justify-end items-center">
          <button
            onClick={() => onSave(field.trim(), type.trim(), value.trim())}
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

export default function SchemaTable() {
  const [fields, setFields] = useState<AboutField[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSudo, setIsSudo] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingField, setEditingField] = useState<AboutField | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsSudo(localStorage.getItem("sudoUnlocked") === "true");
    const handler = () => setIsSudo(localStorage.getItem("sudoUnlocked") === "true");
    window.addEventListener("sudo-unlocked", handler);
    return () => window.removeEventListener("sudo-unlocked", handler);
  }, []);

  async function fetchFields() {
    setLoading(true);
    try {
      const res = await fetch("/api/about");
      const data = await res.json();
      setFields(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to load fields.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFields();
  }, []);

  async function handleSave(field: string, type: string, value: string) {
    setSaving(true);
    try {
      const isEdit = !!editingField;
      const res = await fetch("/api/about", {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          "x-sudo-token": sudoToken(),
        },
        body: JSON.stringify(isEdit ? { id: editingField!.id, field, type, value } : { field, type, value }),
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
      setEditingField(undefined);
      await fetchFields();
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this field?")) return;
    try {
      const res = await fetch("/api/about", {
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
      await fetchFields();
    } catch {
      setError("Network error.");
    }
  }

  return (
    <div>
      {isSudo && (
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => {
              setEditingField(undefined);
              setShowEditor(true);
            }}
            className="font-mono text-[12px] px-3.5 py-1.5 rounded border border-accent/40 bg-accent/10 text-accent hover:bg-accent/20 transition-colors ml-auto"
          >
            + new field
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
        <div className="border border-hairline rounded-md overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[44px] border-b border-hairline last:border-b-0 bg-surface animate-pulse" />
          ))}
        </div>
      ) : fields.length === 0 ? (
        <p className="font-mono text-[12px] text-center text-text-dimmer">no fields yet</p>
      ) : (
        <div className="border border-hairline rounded-md overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-[140px_110px_1fr] bg-surface-2 text-text-dimmer font-mono text-[11px] uppercase tracking-wide">
            <div className="px-4 py-3 border-b border-hairline sm:border-r">field</div>
            <div className="hidden sm:block px-4 py-3 border-b border-hairline sm:border-r">type</div>
            <div className="hidden sm:block px-4 py-3 border-b border-hairline">value</div>
          </div>
          {fields.map((row, i) => (
            <div
              key={row.id}
              className={`grid grid-cols-1 sm:grid-cols-[140px_110px_1fr] font-mono text-[13px] relative ${
                i !== fields.length - 1 ? "border-b border-hairline" : ""
              }`}
            >
              <div className="px-4 py-3 border-b sm:border-b-0 sm:border-r border-hairline text-blue">
                {row.field}
              </div>
              <div className="px-4 py-3 border-b sm:border-b-0 sm:border-r border-hairline text-text-dimmer">
                {row.type}
              </div>
              <div className={`px-4 py-3 font-sans text-sm text-text ${isSudo ? "pr-16" : ""}`}>{row.value}</div>

              {isSudo && (
                <div className="absolute top-2 right-2 flex items-center gap-1.5">
                  <span
                    role="button"
                    onClick={() => {
                      setEditingField(row);
                      setShowEditor(true);
                    }}
                    className="font-mono text-[10px] px-2 py-0.5 rounded border border-hairline bg-surface text-text-dimmer hover:text-blue hover:border-blue transition-colors cursor-pointer"
                  >
                    edit
                  </span>
                  <span
                    role="button"
                    onClick={() => handleDelete(row.id)}
                    className="font-mono text-[10px] px-2 py-0.5 rounded border border-hairline bg-surface text-text-dimmer hover:text-accent hover:border-accent transition-colors cursor-pointer"
                  >
                    del
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showEditor && (
        <FieldEditorModal
          initial={editingField}
          onSave={handleSave}
          onClose={() => {
            setShowEditor(false);
            setEditingField(undefined);
          }}
          saving={saving}
        />
      )}
    </div>
  );
}
