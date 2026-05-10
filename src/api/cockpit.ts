import { getApiConfig } from '../storage';

function getBaseUrl() {
  return getApiConfig().url;
}

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'api-key': getApiConfig().key,
  };
}

function getItems(result) {
  if (Array.isArray(result)) return result;
  return result?.items ?? [];
}

export async function fetchDeals() {
  const res = await fetch(`${getBaseUrl()}/content/items/deals`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch deals: ${res.status}`);
  const result = await res.json();
  return { items: getItems(result), total: getItems(result).length };
}

export async function createDeal(data) {
  const res = await fetch(`${getBaseUrl()}/content/item/deals`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ data }),
  });
  if (!res.ok) throw new Error(`Failed to create deal: ${res.status}`);
  return res.json();
}

export async function updateDeal(id, data) {
  data._id = id;
  const res = await fetch(`${getBaseUrl()}/content/item/deals`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ data }),
  });
  if (!res.ok) throw new Error(`Failed to update deal: ${res.status}`);
  return res.json();
}

export async function deleteDeal(id) {
  const res = await fetch(`${getBaseUrl()}/content/item/deals/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to delete deal: ${res.status}`);
  return res.json();
}

export async function fetchStages() {
  const res = await fetch(`${getBaseUrl()}/content/items/stages`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch stages: ${res.status}`);
  const result = await res.json();
  return { items: getItems(result), total: getItems(result).length };
}

export async function createStage(data) {
  const res = await fetch(`${getBaseUrl()}/content/item/stages`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ data }),
  });
  if (!res.ok) throw new Error(`Failed to create stage: ${res.status}`);
  return res.json();
}

export async function updateStage(id, data) {
  data._id = id;
  const res = await fetch(`${getBaseUrl()}/content/item/stages`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ data }),
  });
  if (!res.ok) throw new Error(`Failed to update stage: ${res.status}`);
  return res.json();
}

export async function deleteStage(id) {
  const res = await fetch(`${getBaseUrl()}/content/item/stages/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to delete stage: ${res.status}`);
  return res.json();
}
