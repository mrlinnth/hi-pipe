import { getApiConfig } from '../storage';
import type { Deal, Stage } from '../types';

function getBaseUrl() {
  return getApiConfig().url;
}

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'api-key': getApiConfig().key,
  };
}

function getItems(result: unknown): unknown[] {
  if (Array.isArray(result)) return result;
  if (typeof result === 'object' && result !== null && 'items' in result) {
    const items = (result as { items?: unknown[] }).items;
    return Array.isArray(items) ? items : [];
  }
  return [];
}

export async function fetchDeals(): Promise<{ items: Deal[]; total: number }> {
  const res = await fetch(`${getBaseUrl()}/content/items/deals`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch deals: ${res.status}`);
  const result: unknown = await res.json();
  const items = getItems(result) as Deal[];
  return { items, total: items.length };
}

export async function createDeal(data: Partial<Deal>): Promise<Deal> {
  const res = await fetch(`${getBaseUrl()}/content/item/deals`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ data }),
  });
  if (!res.ok) throw new Error(`Failed to create deal: ${res.status}`);
  return res.json() as Promise<Deal>;
}

export async function updateDeal(id: string, data: Partial<Deal>): Promise<Deal> {
  data._id = id;
  const res = await fetch(`${getBaseUrl()}/content/item/deals`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ data }),
  });
  if (!res.ok) throw new Error(`Failed to update deal: ${res.status}`);
  return res.json() as Promise<Deal>;
}

export async function deleteDeal(id: string): Promise<void> {
  const res = await fetch(`${getBaseUrl()}/content/item/deals/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to delete deal: ${res.status}`);
  await res.json();
}

export async function fetchStages(): Promise<{ items: Stage[]; total: number }> {
  const res = await fetch(`${getBaseUrl()}/content/items/stages`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch stages: ${res.status}`);
  const result: unknown = await res.json();
  const items = getItems(result) as Stage[];
  return { items, total: items.length };
}

export async function createStage(data: Partial<Stage>): Promise<Stage> {
  const res = await fetch(`${getBaseUrl()}/content/item/stages`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ data }),
  });
  if (!res.ok) throw new Error(`Failed to create stage: ${res.status}`);
  return res.json() as Promise<Stage>;
}

export async function updateStage(id: string, data: Partial<Stage>): Promise<Stage> {
  data._id = id;
  const res = await fetch(`${getBaseUrl()}/content/item/stages`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ data }),
  });
  if (!res.ok) throw new Error(`Failed to update stage: ${res.status}`);
  return res.json() as Promise<Stage>;
}

export async function deleteStage(id: string): Promise<void> {
  const res = await fetch(`${getBaseUrl()}/content/item/stages/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to delete stage: ${res.status}`);
  await res.json();
}
