// Runtime configuration read from window.EXAMFORGE_CONFIG (injected by config.js).
// When no API base is set, the app runs in client-only practice mode.

declare global {
  interface Window {
    EXAMFORGE_CONFIG?: { apiBase?: string | null };
  }
}

const USER_KEY = 'examforge:uid';

/** The API base URL, or null when running client-only (local dev). */
export function apiBase(): string | null {
  const b = window.EXAMFORGE_CONFIG?.apiBase;
  return typeof b === 'string' && b.length > 0 ? b.replace(/\/$/, '') : null;
}

export function backendEnabled(): boolean {
  return apiBase() !== null;
}

/** The anonymous device id: generated once and kept in localStorage. */
export function userId(): string {
  let id = localStorage.getItem(USER_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(USER_KEY, id);
  }
  return id;
}
