// UI sound effects for the `sfx` terminal command.
//
// Sound packs are per-theme (see src/lib/theme.ts) and live in public/sfx as
// `<pack>_<kind>.mp3`. The default theme has no pack, so it stays silent —
// sfx are part of the NieR / Souls skins, not the base site.
//
// Playback goes through Web Audio rather than <audio> elements so rapid `move`
// hovers can overlap instead of cutting each other off.

import { currentTheme, type ThemeName } from "./theme";

export const SFX_STORAGE_KEY = "sfx";

export const SFX_MODES = ["default", "quiet", "off"] as const;
export type SfxMode = (typeof SFX_MODES)[number];

const ALIASES: Record<string, SfxMode> = {
  default: "default",
  on: "default",
  full: "default",
  quiet: "quiet",
  low: "quiet",
  off: "off",
  mute: "off",
  none: "off",
};

export const SFX_LABELS: Record<SfxMode, string> = {
  default: "default",
  quiet: "quiet",
  off: "off",
};

const MODE_GAIN: Record<SfxMode, number> = { default: 0.6, quiet: 0.2, off: 0 };

export type SfxKind = "init" | "move" | "select";
const KINDS: readonly SfxKind[] = ["init", "move", "select"];

const THEME_PACK: Record<ThemeName, string | null> = {
  default: null,
  nier: "nier",
  souls: "ds",
};

// Rapid hovers along a nav list would otherwise machine-gun the move sound.
const MIN_GAP_MS: Record<SfxKind, number> = { init: 300, move: 45, select: 45 };

export function normalizeSfxMode(input: string): SfxMode | null {
  return ALIASES[input.trim().toLowerCase()] ?? null;
}

let mode: SfxMode | null = null;

export function currentSfxMode(): SfxMode {
  if (mode) return mode;
  try {
    mode = normalizeSfxMode(localStorage.getItem(SFX_STORAGE_KEY) ?? "") ?? "default";
  } catch {
    mode = "default"; // storage blocked — sfx still work for this session
  }
  return mode;
}

export function setSfxMode(next: SfxMode) {
  mode = next;
  try {
    localStorage.setItem(SFX_STORAGE_KEY, next);
  } catch {
    // storage blocked — mode still applies for this session
  }
}

// ── audio graph ─────────────────────────────────────────────────────────────

type WindowWithWebkitAudio = Window & { webkitAudioContext?: typeof AudioContext };

let ctx: AudioContext | null = null;
const buffers = new Map<string, Promise<AudioBuffer | null>>();
const lastPlayedAt: Partial<Record<SfxKind, number>> = {};

function audioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as WindowWithWebkitAudio).webkitAudioContext;
  if (!Ctor) return null;
  ctx ??= new Ctor();
  // Autoplay policy: the context starts suspended and only resumes once we are
  // inside (or downstream of) a real user gesture.
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function load(pack: string, kind: SfxKind): Promise<AudioBuffer | null> {
  const key = `${pack}_${kind}`;
  let pending = buffers.get(key);
  if (!pending) {
    pending = fetch(`/sfx/${key}.mp3`)
      .then((res) => res.arrayBuffer())
      .then((bytes) => {
        const c = audioCtx();
        return c ? c.decodeAudioData(bytes) : null;
      })
      .catch(() => null);
    buffers.set(key, pending);
  }
  return pending;
}

export function playSfx(kind: SfxKind) {
  if (currentSfxMode() === "off") return;
  const pack = THEME_PACK[currentTheme()];
  if (!pack) return;

  const now = performance.now();
  if (now - (lastPlayedAt[kind] ?? -Infinity) < MIN_GAP_MS[kind]) return;
  lastPlayedAt[kind] = now;

  const c = audioCtx();
  if (!c) return;

  void load(pack, kind).then((buffer) => {
    // Re-check: the mode may have flipped while the file was decoding.
    if (!buffer || currentSfxMode() === "off") return;
    const source = c.createBufferSource();
    source.buffer = buffer;
    const gain = c.createGain();
    gain.gain.value = MODE_GAIN[currentSfxMode()];
    source.connect(gain).connect(c.destination);
    source.start();
  });
}

// Warm the cache for the active theme so the first hover isn't silent.
export function prefetchSfx() {
  if (currentSfxMode() === "off") return;
  const pack = THEME_PACK[currentTheme()];
  if (!pack || !audioCtx()) return;
  for (const kind of KINDS) void load(pack, kind);
}
