const BASE_URL = import.meta.env.VITE_COCKPIT_API_URL;
const API_KEY = import.meta.env.VITE_COCKPIT_API_KEY;

const headers = {
  'Content-Type': 'application/json',
  'api-key': API_KEY,
};

export async function fetchDeals() {
  const res = await fetch(`${BASE_URL}/content/items/deals`, { headers });
  if (!res.ok) throw new Error(`Failed to fetch deals: ${res.status}`);
  return res.json();
}

export async function createDeal(data) {
  const res = await fetch(`${BASE_URL}/content/item/deals`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to create deal: ${res.status}`);
  return res.json();
}

export async function updateDeal(id, data) {
  const res = await fetch(`${BASE_URL}/content/item/deals/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to update deal: ${res.status}`);
  return res.json();
}

export async function deleteDeal(id) {
  const res = await fetch(`${BASE_URL}/content/item/deals/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) throw new Error(`Failed to delete deal: ${res.status}`);
  return res.json();
}

export async function fetchStages() {
  const res = await fetch(`${BASE_URL}/content/items/stages?sort=sort_order:1`, { headers });
  if (!res.ok) throw new Error(`Failed to fetch stages: ${res.status}`);
  return res.json();
}

export async function createStage(data) {
  const res = await fetch(`${BASE_URL}/content/item/stages`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to create stage: ${res.status}`);
  return res.json();
}

export async function updateStage(id, data) {
  const res = await fetch(`${BASE_URL}/content/item/stages/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to update stage: ${res.status}`);
  return res.json();
}

export async function deleteStage(id) {
  const res = await fetch(`${BASE_URL}/content/item/stages/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) throw new Error(`Failed to delete stage: ${res.status}`);
  return res.json();
}
