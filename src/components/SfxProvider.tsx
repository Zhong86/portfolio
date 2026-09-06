"use client";

// One delegated listener pair for the whole app, so every current and future
// button/link gets sfx without touching its own handler.
//
//   hover  → move   (opt-in: elements tagged data-sfx="move", i.e. nav links)
//   press  → select (any button/link, unless tagged data-sfx="none")
//
// Theme-switch `init` and keyboard-driven sounds are fired explicitly from
// Terminal.tsx, since neither goes through these events.

import { useEffect } from "react";
import { playSfx, prefetchSfx } from "@/lib/sfx";

const SELECT_SELECTOR = 'a[href], button, [role="button"], summary';
const MOVE_SELECTOR = '[data-sfx~="move"]';

export default function SfxProvider() {
  useEffect(() => {
    // The very first gesture is what lets the AudioContext leave `suspended`,
    // so it doubles as the cue to warm the buffer cache.
    const unlock = () => prefetchSfx();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (!(target instanceof Element)) return;
      if (target.closest('[data-sfx~="none"]')) return;
      if (target.closest(SELECT_SELECTOR)) playSfx("select");
    };

    const onPointerOver = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return; // touch "hover" is really a tap
      const target = e.target as Element | null;
      if (!(target instanceof Element)) return;
      const hit = target.closest(MOVE_SELECTOR);
      if (!hit) return;
      // pointerover bubbles for every child; only fire on a true enter.
      const from = e.relatedTarget;
      if (from instanceof Node && hit.contains(from)) return;
      playSfx("move");
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("pointerover", onPointerOver, true);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("pointerover", onPointerOver, true);
    };
  }, []);

  return null;
}
