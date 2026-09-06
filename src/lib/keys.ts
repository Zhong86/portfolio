/**
 * Helpers for global (window-level) keyboard shortcuts.
 *
 * Shortcuts are single, unmodified keys ("/", "j", "k"), so they must stay out
 * of the way whenever the user is actually typing or a modal owns the keyboard.
 */

/** True when the keystroke belongs to a text field or carries a modifier. */
export function isTypingTarget(e: KeyboardEvent): boolean {
  if (e.ctrlKey || e.metaKey || e.altKey) return true;
  const el = e.target as HTMLElement | null;
  if (!el) return false;
  if (el.isContentEditable) return true;
  return el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT";
}

/**
 * True while a full-screen overlay (chat, sudo) is mounted. Those set
 * `data-modal-open` on their root so background shortcuts stand down.
 */
export function isModalOpen(): boolean {
  return document.querySelector("[data-modal-open]") !== null;
}
