const store = new Map();
const TTL_MS = 10 * 60 * 1000;
const MAX_ENTRIES = 100;

export function get(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

export function set(key, value) {
  if (store.size >= MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    store.delete(oldest);
  }
  store.set(key, { value, expires: Date.now() + TTL_MS });
}