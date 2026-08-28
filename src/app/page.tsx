"use client";

import { useEffect, useState, useRef } from "react";
import LogStream from "@/components/LogStream";
import { DEFAULT_HOME, HomeContent } from "@/lib/config";

function sudoToken(): string {
  return localStorage.getItem("sudoToken") ?? "";
}

function formatDurationYearsMonths(years: number, months: number) {
  return `${years}Y ${months}M`;
}

function HomeEditorModal({
  initial,
  onSave,
  onClose,
  saving,
}: {
  initial: HomeContent;
  onSave: (content: HomeContent) => Promise<void>;
  onClose: () => void;
  saving: boolean;
}) {
  const [tagline, setTagline] = useState(initial.tagline);
  const [headlinePrefix, setHeadlinePrefix] = useState(initial.headlinePrefix);
  const [accentWord, setAccentWord] = useState(initial.accentWord);
  const [startDate, setStartDate] = useState(initial.startDate.slice(0, 10));
  const [description, setDescription] = useState(initial.description);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") onClose();
  }

  const canSave =
    tagline.trim() && headlinePrefix.trim() && accentWord.trim() && startDate && description.trim();

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-lg mx-4 flex flex-col gap-3 rounded-xl border border-accent/40 bg-surface-2/97 backdrop-blur-md shadow-2xl shadow-black/60"
        style={{ maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="border-b border-hairline/60 px-5 py-3 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span className="font-mono text-[13px] text-text-dim">editing · homepage</span>
          </div>
          <button onClick={onClose} className="font-mono text-[11px] text-text-dimmer hover:text-accent transition-colors">
            esc · cancel
          </button>
        </div>

        <div className="px-5 pt-1 flex flex-col gap-3 overflow-y-auto">
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[11px] text-text-dimmer uppercase tracking-wide">tagline</span>
            <input
              ref={inputRef}
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="fullstack engineer · ai agent engineer"
              className="font-mono text-[13px] text-text bg-surface border border-hairline rounded px-3 py-1.5 outline-none focus:border-accent/60 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[11px] text-text-dimmer uppercase tracking-wide">headline prefix</span>
            <input
              type="text"
              value={headlinePrefix}
              onChange={(e) => setHeadlinePrefix(e.target.value)}
              placeholder="A guy who just loves to"
              className="font-mono text-[13px] text-text bg-surface border border-hairline rounded px-3 py-1.5 outline-none focus:border-accent/60 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[11px] text-text-dimmer uppercase tracking-wide">accent word</span>
            <input
              type="text"
              value={accentWord}
              onChange={(e) => setAccentWord(e.target.value)}
              placeholder="code"
              className="font-mono text-[13px] text-text bg-surface border border-hairline rounded px-3 py-1.5 outline-none focus:border-accent/60 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[11px] text-text-dimmer uppercase tracking-wide">start date</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="font-mono text-[13px] text-text bg-surface border border-hairline rounded px-3 py-1.5 outline-none focus:border-accent/60 transition-colors"
            />
          </div>
        </div>

        <div className="px-5 pb-5 flex flex-col gap-1.5">
          <span className="font-mono text-[11px] text-text-dimmer uppercase tracking-wide">description</span>
          <textarea
            value={description}
            rows={4}
            onChange={(e) => setDescription(e.target.value)}
            className="font-mono text-[12.5px] text-text bg-surface border border-hairline rounded-md px-3 py-2 leading-relaxed outline-none focus:border-accent/50 transition-colors resize-none placeholder:text-text-dimmer"
          />
        </div>

        <div className="border-t border-hairline/60 px-5 py-3 shrink-0 flex justify-end items-center">
          <button
            onClick={() =>
              onSave({
                tagline: tagline.trim(),
                headlinePrefix: headlinePrefix.trim(),
                accentWord: accentWord.trim(),
                startDate: new Date(startDate + "T00:00:00Z").toISOString(),
                description: description.trim(),
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

export default function HomePage() {
  const [content, setContent] = useState<HomeContent>(DEFAULT_HOME);
  const [loading, setLoading] = useState(true);
  const [duration, setDuration] = useState("");
  const [isSudo, setIsSudo] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsSudo(localStorage.getItem("sudoUnlocked") === "true");
    const handler = () => setIsSudo(localStorage.getItem("sudoUnlocked") === "true");
    window.addEventListener("sudo-unlocked", handler);
    return () => window.removeEventListener("sudo-unlocked", handler);
  }, []);

  async function fetchContent() {
    setLoading(true);
    try {
      const res = await fetch("/api/home");
      const data = await res.json();
      setContent(data);
    } catch {
      setError("Failed to load content.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchContent();
  }, []);

  useEffect(() => {
    function update() {
      const start = new Date(content.startDate);
      const now = new Date();
      let years = now.getFullYear() - start.getFullYear();
      let months = now.getMonth() - start.getMonth();
      if (months < 0) {
        years -= 1;
        months += 12;
      }
      setDuration(formatDurationYearsMonths(years, months));
    }
    update();
  }, [content.startDate]);

  async function handleSave(next: HomeContent) {
    setSaving(true);
    try {
      const res = await fetch("/api/home", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-sudo-token": sudoToken(),
        },
        body: JSON.stringify(next),
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
      await fetchContent();
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="animate-page-in max-w-[760px] mx-auto px-6 md:px-0 pt-16 pb-10">
      {isSudo && (
        <div className="flex justify-end mb-3">
          <button
            onClick={() => setShowEditor(true)}
            className="font-mono text-[12px] px-3.5 py-1.5 rounded border border-accent/40 bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
          >
            edit page
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 border border-accent/30 rounded-md px-4 py-2.5 bg-accent/5 font-mono text-[12px] text-accent flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-text-dimmer hover:text-text ml-4 text-lg leading-none">×</button>
        </div>
      )}

      <div className="font-mono text-xs text-text-dim tracking-wide mb-4">
        {`// ${content.tagline}`}
      </div>
      <h1 className="font-mono text-[28px] sm:text-[34px] font-medium leading-[1.25] mb-3 tracking-tight">
        {content.headlinePrefix} <span className="text-accent">{content.accentWord}</span>.
        <br />
        <span className="text-accent">{loading ? "" : duration}</span> since I started learning Software Engineering.
      </h1>
      <p className="font-sans text-base text-text-dim max-w-[520px] mb-8" style={{ whiteSpace: "pre-wrap" }}>
        {content.description}
      </p>

      <LogStream />

      {showEditor && (
        <HomeEditorModal
          initial={content}
          onSave={handleSave}
          onClose={() => setShowEditor(false)}
          saving={saving}
        />
      )}
    </div>
  );
}
