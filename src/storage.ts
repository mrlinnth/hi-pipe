import type { Deal, Stage } from './types';

const KEYS = {
  API_URL:  'hipipe_api_url',
  API_KEY:  'hipipe_api_key',
  DEALS:    'hipipe_deals',
  STAGES:   'hipipe_stages',
  SECTORS:  'hipipe_sectors',
};

export const DEFAULT_SECTORS: string[] = [
  'Banking',
  'Insurance / Healthcare',
  'Microfinance / Edu / Hotel',
  'Manufacture / Retail',
  'Telecom / Infra / Media',
];

export const DEFAULT_STAGES: Stage[] = [
  { _id: 'local_default_1', name: 'Lead',     slug: 'lead',     color: '#F59E0B', sort_order: 1 },
  { _id: 'local_default_2', name: 'Progress', slug: 'progress', color: '#3B82F6', sort_order: 2 },
  { _id: 'local_default_3', name: 'Won',      slug: 'won',      color: '#10B981', sort_order: 3 },
  { _id: 'local_default_4', name: 'Lost',     slug: 'lost',     color: '#EF4444', sort_order: 4 },
  { _id: 'local_default_5', name: 'Pause',    slug: 'pause',    color: '#6B7280', sort_order: 5 },
];

// --- API config ---

export function getApiConfig(): { url: string; key: string } {
  return {
    url: localStorage.getItem(KEYS.API_URL) ?? import.meta.env.VITE_COCKPIT_API_URL ?? '',
    key: localStorage.getItem(KEYS.API_KEY) ?? import.meta.env.VITE_COCKPIT_API_KEY ?? '',
  };
}

export function saveApiConfig(url: string, key: string): void {
  localStorage.setItem(KEYS.API_URL, url.trim());
  localStorage.setItem(KEYS.API_KEY, key.trim());
}

export function clearApiConfig(): void {
  localStorage.removeItem(KEYS.API_URL);
  localStorage.removeItem(KEYS.API_KEY);
}

export function isApiConfigured(): boolean {
  const { url, key } = getApiConfig();
  return url.length > 0 && key.length > 0;
}

// --- Cache helpers ---

function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : null;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, items: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // storage quota exceeded - silently ignore
  }
}

// --- Deals ---

export function getCachedDeals(): Deal[] {
  return readCache(KEYS.DEALS) ?? [];
}

export function setCachedDeals(items: Deal[]): void {
  writeCache(KEYS.DEALS, items);
}

export function localCreateDeal(data: Partial<Deal>): Deal {
  const items = getCachedDeals();
  const newItem: Deal = { ...(data as Deal), _id: `local_${crypto.randomUUID()}`, _created: Date.now() };
  setCachedDeals([...items, newItem]);
  return newItem;
}

export function localUpdateDeal(id: string, data: Partial<Deal>): Deal | undefined {
  const items = getCachedDeals();
  const updated = items.map((d: Deal) => d._id === id ? { ...d, ...data, _id: id } : d);
  setCachedDeals(updated);
  return updated.find((d: Deal) => d._id === id);
}

export function localDeleteDeal(id: string): void {
  setCachedDeals(getCachedDeals().filter((d: Deal) => d._id !== id));
}

// --- Stages ---

export function getCachedStages(): Stage[] {
  return readCache(KEYS.STAGES) ?? DEFAULT_STAGES;
}

export function setCachedStages(items: Stage[]): void {
  writeCache(KEYS.STAGES, items);
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function localCreateStage(data: Partial<Stage>): Stage {
  const items = getCachedStages();
  const maxOrder = items.reduce((m: number, s: Stage) => Math.max(m, s.sort_order ?? 0), 0);
  const newItem: Stage = {
    ...data,
    _id: `local_${crypto.randomUUID()}`,
    name: data.name ?? '',
    color: data.color ?? '#1A1A18',
    slug: data.slug ?? slugify(data.name ?? ''),
    sort_order: maxOrder + 1,
  };
  setCachedStages([...items, newItem]);
  return newItem;
}

export function localUpdateStage(id: string, data: Partial<Stage>): Stage | undefined {
  const items = getCachedStages();
  const updated = items.map((s: Stage) => s._id === id ? { ...s, ...data, _id: id } : s);
  setCachedStages(updated);
  return updated.find((s: Stage) => s._id === id);
}

export function localDeleteStage(id: string): void {
  setCachedStages(getCachedStages().filter((s: Stage) => s._id !== id));
}

// --- Sectors ---

export function getSectors(): string[] {
  return readCache(KEYS.SECTORS) ?? DEFAULT_SECTORS;
}

export function saveSectors(items: string[]): void {
  writeCache(KEYS.SECTORS, items);
}

export function resetSectors(): void {
  localStorage.removeItem(KEYS.SECTORS);
}
