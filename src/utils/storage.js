export function lsSet(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function lsGet(key, fallback = null) {
  const raw = localStorage.getItem(key);
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function lsRemove(key) {
  localStorage.removeItem(key);
}

export function lsClear() {
  localStorage.clear();
}
