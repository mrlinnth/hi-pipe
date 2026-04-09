const KEYS = {
  API_URL: 'hipipe_api_url',
  API_KEY: 'hipipe_api_key',
  DEALS:   'hipipe_deals',
  STAGES:  'hipipe_stages',
};

export const DEFAULT_STAGES = [
  { _id: 'local_default_1', name: 'Lead',       slug: 'lead',       color: '#6366F1', sort_order: 1 },
  { _id: 'local_default_2', name: 'Qualified',  slug: 'qualified',  color: '#F59E0B', sort_order: 2 },
  { _id: 'local_default_3', name: 'Proposal',   slug: 'proposal',   color: '#3B82F6', sort_order: 3 },
  { _id: 'local_default_4', name: 'Closed Won', slug: 'closed-won', color: '#10B981', sort_order: 4 },
];

// --- API config ---

export function getApiConfig() {
  return {
    url: localStorage.getItem(KEYS.API_URL) ?? import.meta.env.VITE_COCKPIT_API_URL ?? '',
    key: localStorage.getItem(KEYS.API_KEY) ?? import.meta.env.VITE_COCKPIT_API_KEY ?? '',
  };
}

export function saveApiConfig(url, key) {
  localStorage.setItem(KEYS.API_URL, url.trim());
  localStorage.setItem(KEYS.API_KEY, key.trim());
}

export function clearApiConfig() {
  localStorage.removeItem(KEYS.API_URL);
  localStorage.removeItem(KEYS.API_KEY);
}

export function isApiConfigured() {
  const { url, key } = getApiConfig();
  return url.length > 0 && key.length > 0;
}

// --- Cache helpers ---

function readCache(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(key, items) {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // storage quota exceeded - silently ignore
  }
}

// --- Deals ---

export function getCachedDeals() {
  return readCache(KEYS.DEALS) ?? [];
}

export function setCachedDeals(items) {
  writeCache(KEYS.DEALS, items);
}

export function localCreateDeal(data) {
  const items = getCachedDeals();
  const newItem = { ...data, _id: `local_${crypto.randomUUID()}`, _created: Date.now() };
  setCachedDeals([...items, newItem]);
  return newItem;
}

export function localUpdateDeal(id, data) {
  const items = getCachedDeals();
  const updated = items.map(d => d._id === id ? { ...d, ...data, _id: id } : d);
  setCachedDeals(updated);
  return updated.find(d => d._id === id);
}

export function localDeleteDeal(id) {
  setCachedDeals(getCachedDeals().filter(d => d._id !== id));
}

// --- Stages ---

export function getCachedStages() {
  return readCache(KEYS.STAGES) ?? DEFAULT_STAGES;
}

export function setCachedStages(items) {
  writeCache(KEYS.STAGES, items);
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function localCreateStage(data) {
  const items = getCachedStages();
  const maxOrder = items.reduce((m, s) => Math.max(m, s.sort_order ?? 0), 0);
  const newItem = {
    ...data,
    _id: `local_${crypto.randomUUID()}`,
    slug: slugify(data.name),
    sort_order: maxOrder + 1,
  };
  setCachedStages([...items, newItem]);
  return newItem;
}

export function localUpdateStage(id, data) {
  const items = getCachedStages();
  const updated = items.map(s => s._id === id ? { ...s, ...data, _id: id } : s);
  setCachedStages(updated);
  return updated.find(s => s._id === id);
}

export function localDeleteStage(id) {
  setCachedStages(getCachedStages().filter(s => s._id !== id));
}
