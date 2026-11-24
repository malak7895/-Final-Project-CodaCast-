// Simple JSON helpers for LocalStorage – used throughout the VELORA frontend.
// These helpers respect the existing VELORA design system (no UI impact).

export function readJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_) {
    return fallback;
  }
}

export function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (_) {
    // Silently ignore storage errors – VELORA UI will continue to work.
  }
}
