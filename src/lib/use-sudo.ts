"use client";

import { useEffect, useState } from "react";

/** The sudo password, stored by the terminal after a successful `sudo`. */
export function sudoToken(): string {
  return localStorage.getItem("sudoToken") ?? "";
}

/** Headers for a request that should be authorized as sudo. */
export function sudoHeaders(): Record<string, string> {
  return { "x-sudo-token": sudoToken() };
}

/**
 * Tracks whether the sudo session is unlocked, staying in sync with the
 * terminal via the `sudo-unlocked` event.
 *
 * Returns `null` until localStorage has been read on mount — callers that
 * hide content should treat `null` as locked, so gated UI never flashes
 * during hydration.
 */
export function useSudo(): boolean | null {
  const [isSudo, setIsSudo] = useState<boolean | null>(null);

  useEffect(() => {
    const check = () => setIsSudo(localStorage.getItem("sudoUnlocked") === "true");
    check();
    window.addEventListener("sudo-unlocked", check);
    return () => window.removeEventListener("sudo-unlocked", check);
  }, []);

  return isSudo;
}
