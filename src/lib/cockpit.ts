import { getApiConfig } from '../storage';
import type { CockpitUser } from '../types';

const USERS_PATH = '/content/items/users';
const USER_ITEM_PATH = '/content/item/users';

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

function buildUsersUrl(msEmail: string): string {
  const url = new URL(`${getBaseUrl()}${USERS_PATH}`);
  url.searchParams.set('filter[ms_email]', msEmail);
  url.searchParams.set('limit', '1');
  url.searchParams.set('populate', '1');
  return url.toString();
}

function getItems(payload: unknown): CockpitUser[] {
  if (Array.isArray(payload)) {
    return payload as CockpitUser[];
  }

  if (typeof payload === 'object' && payload !== null && 'items' in payload) {
    const items = (payload as { items?: unknown }).items;
    return Array.isArray(items) ? (items as CockpitUser[]) : [];
  }

  return [];
}

export async function findOrCreateUser(email: string, name: string): Promise<CockpitUser> {
  const lookupResponse = await fetch(buildUsersUrl(email), {
    headers: getHeaders(),
  });

  if (!lookupResponse.ok) {
    throw new Error(`Failed to look up user: ${lookupResponse.status}`);
  }

  const lookupPayload: unknown = await lookupResponse.json();
  const existingUser = getItems(lookupPayload)[0];
  if (existingUser) {
    return existingUser;
  }

  const fallbackName = name.trim() || email.split('@')[0] || 'New User';
  const createResponse = await fetch(`${getBaseUrl()}${USER_ITEM_PATH}`, {
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

  if (!createResponse.ok) {
    throw new Error(`Failed to create user: ${createResponse.status}`);
  }

  return createResponse.json() as Promise<CockpitUser>;
}
