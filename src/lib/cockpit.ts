import { getApiConfig } from '../storage';
import type { CockpitClient, CockpitFinancialQuarter, CockpitSector, CockpitUser, Deal, Stage } from '../types';

const USERS_PATH = '/content/items/users';
const USER_ITEM_PATH = '/content/item/users';

const DEALS_PATH = '/content/items/deals';
const DEAL_ITEM_PATH = '/content/item/deals';
const STAGES_PATH = '/content/items/stages';
const STAGE_ITEM_PATH = '/content/item/stages';
const CLIENTS_PATH = '/content/items/clients';
const SECTORS_PATH = '/content/items/sectors';
const QUARTERS_PATH = '/content/items/financialquarters';

function getBaseUrl(): string {
  const url = getApiConfig().url.trim();
  if (!url) {
    throw new Error('Cockpit API URL is not configured.');
  }
  return url.replace(/\/+$/, '');
}

function getHeaders(): HeadersInit {
  const key = getApiConfig().key.trim();
  if (!key) {
    throw new Error('Cockpit API key is not configured.');
  }

  return {
    'Api-Key': key,
    'Content-Type': 'application/json',
  };
}

function buildUrl(path: string, params?: Record<string, string | number | boolean>): string {
  const url = new URL(`${getBaseUrl()}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

function getItems<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (typeof payload === 'object' && payload !== null && 'items' in payload) {
    const items = (payload as { items?: unknown }).items;
    return Array.isArray(items) ? (items as T[]) : [];
  }

  return [];
}

function sortByName<T extends { name?: string }>(items: T[]): T[] {
  return [...items].sort((left, right) => (left.name ?? '').localeCompare(right.name ?? ''));
}

function sortByQuarterNumber(items: CockpitFinancialQuarter[]): CockpitFinancialQuarter[] {
  return [...items].sort((left, right) => left.quarter_number - right.quarter_number);
}

async function fetchCollection<T>(path: string, params?: Record<string, string | number | boolean>): Promise<T[]> {
  const response = await fetch(buildUrl(path, params), { headers: getHeaders() });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.status}`);
  }

  const payload: unknown = await response.json();
  return getItems<T>(payload);
}

export async function findOrCreateUser(email: string, name: string): Promise<CockpitUser> {
  const existingUsers = await fetchCollection<CockpitUser>(USERS_PATH, {
    'filter[ms_email]': email,
    limit: 1,
    populate: 1,
  });

  if (existingUsers[0]) {
    return existingUsers[0];
  }

  const fallbackName = name.trim() || email.split('@')[0] || 'New User';
  const response = await fetch(buildUrl(USER_ITEM_PATH), {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      data: {
        ms_email: email,
        email,
        name: fallbackName,
        role: 'am',
        approval_status: 'pending',
        active: false,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create user: ${response.status}`);
  }

  return response.json() as Promise<CockpitUser>;
}

export async function fetchClients(): Promise<CockpitClient[]> {
  const items = await fetchCollection<CockpitClient>(CLIENTS_PATH, {
    'sort[name]': 1,
  });
  return sortByName(items);
}

export async function fetchSectors(): Promise<CockpitSector[]> {
  const items = await fetchCollection<CockpitSector>(SECTORS_PATH, {
    'filter[active]': true,
    'sort[name]': 1,
  });
  return sortByName(items);
}

export async function fetchFinancialQuarters(): Promise<CockpitFinancialQuarter[]> {
  const items = await fetchCollection<CockpitFinancialQuarter>(QUARTERS_PATH, {
    'filter[active]': true,
    'sort[quarter_number]': 1,
  });
  return sortByQuarterNumber(items);
}

export async function fetchDeals(userId?: string): Promise<Deal[]> {
  const params: Record<string, string | number | boolean> = { populate: 1 };
  if (userId) {
    params['filter[owner._id]'] = userId;
  }
  return fetchCollection<Deal>(DEALS_PATH, params);
}

export async function createDeal(data: Partial<Deal>, ownerId?: string): Promise<Deal> {
  const payload: Partial<Deal> = { ...data };
  if (ownerId) {
    payload.owner = { _id: ownerId, _model: 'users' };
  }

  const response = await fetch(buildUrl(DEAL_ITEM_PATH), {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ data: payload }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create deal: ${response.status}`);
  }

  return response.json() as Promise<Deal>;
}

export async function updateDeal(id: string, data: Partial<Deal>): Promise<Deal> {
  const response = await fetch(buildUrl(DEAL_ITEM_PATH), {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ data: { _id: id, ...data } }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update deal: ${response.status}`);
  }

  return response.json() as Promise<Deal>;
}

export async function deleteDeal(id: string): Promise<void> {
  const response = await fetch(buildUrl(`${DEAL_ITEM_PATH}/${id}`), {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to delete deal: ${response.status}`);
  }
}

export async function fetchStages(): Promise<{ items: Stage[]; total: number }> {
  const items = await fetchCollection<Stage>(STAGES_PATH, {
    populate: 1,
  });
  return { items, total: items.length };
}

export async function createStage(data: Partial<Stage>): Promise<Stage> {
  const response = await fetch(buildUrl(STAGE_ITEM_PATH), {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ data }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create stage: ${response.status}`);
  }

  return response.json() as Promise<Stage>;
}

export async function updateStage(id: string, data: Partial<Stage>): Promise<Stage> {
  const response = await fetch(buildUrl(STAGE_ITEM_PATH), {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ data: { _id: id, ...data } }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update stage: ${response.status}`);
  }

  return response.json() as Promise<Stage>;
}

export async function deleteStage(id: string): Promise<void> {
  const response = await fetch(buildUrl(`${STAGE_ITEM_PATH}/${id}`), {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to delete stage: ${response.status}`);
  }
}
