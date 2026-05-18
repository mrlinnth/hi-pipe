import { createDeal, deleteDeal, fetchClients, fetchDeals, fetchFinancialQuarters, fetchSectors, fetchStages, updateDeal } from './cockpit';
import { getAll, getQueue, put, putAll, remove } from './db';
import { normalizeUpdatedTeamDeal } from './deals';
import type { CockpitClient, CockpitFinancialQuarter, CockpitSector, Deal, Stage, SyncQueueEntry } from '../types';

const LAST_SYNC_KEY = 'hi_pipe_last_sync';
const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;

export type SyncResult = {
  success: boolean;
  pushed: number;
  errors: string[];
};

let seedPromise: Promise<void> | null = null;

function getLastSyncTimestamp(): number | null {
  try {
    const raw = localStorage.getItem(LAST_SYNC_KEY);
    if (!raw) {
      return null;
    }

    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

function setLastSyncTimestamp(timestamp: number): void {
  try {
    localStorage.setItem(LAST_SYNC_KEY, String(timestamp));
  } catch {
    // Ignore storage failures.
  }
}

function stripPendingFlag(deal: Partial<Deal>): Partial<Deal> {
  const { _pending: _ignored, ...rest } = deal;
  return rest;
}

function getQueueEntryId(entry: SyncQueueEntry): string | null {
  return entry.payload._id ?? entry.tempId ?? null;
}

async function persistReferenceData(
  clients: CockpitClient[],
  stages: Stage[],
  sectors: CockpitSector[],
  quarters: CockpitFinancialQuarter[],
): Promise<void> {
  await Promise.all([
    putAll('clients', clients),
    putAll('stages', stages),
    putAll('sectors', sectors),
    putAll('quarters', quarters),
  ]);
}

async function fetchReferenceData(): Promise<{
  clients: CockpitClient[];
  stages: Stage[];
  sectors: CockpitSector[];
  quarters: CockpitFinancialQuarter[];
}> {
  const [clients, stages, sectors, quarters] = await Promise.all([
    fetchClients(),
    fetchStages().then((result) => result.items),
    fetchSectors(),
    fetchFinancialQuarters(),
  ]);

  return { clients, stages, sectors, quarters };
}

export function shouldRefreshReferenceData(): boolean {
  const timestamp = getLastSyncTimestamp();
  if (!timestamp) {
    return true;
  }

  return Date.now() - timestamp > REFRESH_INTERVAL_MS;
}

export async function seedCache(): Promise<void> {
  if (seedPromise) {
    return seedPromise;
  }

  seedPromise = (async () => {
    const [deals, { clients, stages, sectors, quarters }] = await Promise.all([
      fetchDeals(),
      fetchReferenceData(),
    ]);

    await Promise.all([
      putAll('deals', deals),
      persistReferenceData(clients, stages, sectors, quarters),
    ]);
    setLastSyncTimestamp(Date.now());
  })().finally(() => {
    seedPromise = null;
  });

  return seedPromise;
}

async function reconcileDealsWithPendingChanges(remoteDeals: Deal[]): Promise<Deal[]> {
  const localDeals = await getAll<Deal>('deals');
  const queue = await getQueue();

  const pendingCreateTempIds = new Set<string>();
  const pendingUpdateIds = new Set<string>();
  const pendingDeleteIds = new Set<string>();

  for (const entry of queue) {
    const id = getQueueEntryId(entry);
    if (!id) {
      continue;
    }

    if (entry.action === 'create' && entry.tempId) {
      pendingCreateTempIds.add(entry.tempId);
    }

    if (entry.action === 'update') {
      pendingUpdateIds.add(id);
    }

    if (entry.action === 'delete') {
      pendingDeleteIds.add(id);
    }
  }

  const merged = new Map<string, Deal>();

  for (const deal of remoteDeals) {
    if (pendingDeleteIds.has(deal._id)) {
      continue;
    }

    merged.set(deal._id, deal);
  }

  for (const deal of localDeals) {
    if (deal._pending || pendingCreateTempIds.has(deal._id) || pendingUpdateIds.has(deal._id)) {
      merged.set(deal._id, deal);
    }
  }

  return [...merged.values()];
}

async function refreshDataFromServer(userId?: string): Promise<void> {
  const [remoteDeals, remoteClients] = await Promise.all([
    fetchDeals(userId),
    fetchClients(),
  ]);

  const mergedDeals = await reconcileDealsWithPendingChanges(remoteDeals);
  await Promise.all([
    putAll('deals', mergedDeals),
    putAll('clients', remoteClients),
  ]);

  if (!shouldRefreshReferenceData()) {
    return;
  }

  const { clients, stages, sectors, quarters } = await fetchReferenceData();
  await persistReferenceData(clients, stages, sectors, quarters);
}

export async function syncNow(userId?: string): Promise<SyncResult> {
  const errors: string[] = [];
  let pushed = 0;
  const queue = await getQueue();
  const localDeals = await getAll<Deal>('deals');
  const localDealsById = new Map(localDeals.map((deal) => [deal._id, deal]));
  const tempIdMap = new Map<string, string>();

  for (const entry of queue) {
    const originalId = getQueueEntryId(entry);
    const queueId = entry.id;

    try {
      if (entry.action === 'create') {
        const created = await createDeal(stripPendingFlag(entry.payload), userId);
        const localTempDeal = entry.tempId ? localDealsById.get(entry.tempId) ?? null : null;
        const mergedDeal: Deal = localTempDeal
          ? {
              ...created,
              ...localTempDeal,
              _id: created._id,
              _pending: false,
              owner: created.owner ?? localTempDeal.owner,
              client: localTempDeal.client ?? created.client,
            }
          : { ...created, _pending: false };

        if (entry.tempId) {
          tempIdMap.set(entry.tempId, created._id);
          await remove('deals', entry.tempId);
          localDealsById.delete(entry.tempId);
        }
        await put('deals', mergedDeal);
        localDealsById.set(created._id, mergedDeal);
        pushed += 1;
      } else if (entry.action === 'update') {
        const resolvedId = originalId && tempIdMap.get(originalId) ? tempIdMap.get(originalId) : originalId;
        if (!resolvedId) {
          throw new Error('Missing deal id for update.');
        }
        if (entry.payload._id !== resolvedId) {
          entry.payload = { ...entry.payload, _id: resolvedId };
        }
        const updated = await updateDeal(resolvedId, stripPendingFlag(entry.payload));
        const localDeal = localDealsById.get(resolvedId) ?? null;
        const normalizedDeal = normalizeUpdatedTeamDeal(updated, localDeal, {
          preservePending: false,
          fallbackOwner: entry.payload.owner ?? null,
        });
        await put('deals', normalizedDeal);
        localDealsById.set(resolvedId, normalizedDeal);
        pushed += 1;
      } else {
        const resolvedId = originalId && tempIdMap.get(originalId) ? tempIdMap.get(originalId) : originalId;
        if (!resolvedId) {
          throw new Error('Missing deal id for delete.');
        }
        if (entry.payload._id !== resolvedId) {
          entry.payload = { ...entry.payload, _id: resolvedId };
        }
        await deleteDeal(resolvedId);
        await remove('deals', resolvedId);
        localDealsById.delete(resolvedId);
        pushed += 1;
      }

      if (queueId !== undefined) {
        await remove('sync_queue', queueId);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed';
      errors.push(message);
      if (queueId !== undefined) {
        await put('sync_queue', entry);
      }
    }
  }

  try {
    await refreshDataFromServer(userId);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to refresh data after sync';
    errors.push(message);
  } finally {
    setLastSyncTimestamp(Date.now());
  }

  return {
    success: errors.length === 0,
    pushed,
    errors,
  };
}
