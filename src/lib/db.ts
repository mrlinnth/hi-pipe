import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { CockpitClient, CockpitFinancialQuarter, CockpitSector, Deal, Stage, SyncQueueEntry } from '../types';

export const DB_NAME = 'hi_pipe_db';

type DataStoreName = 'deals' | 'clients' | 'stages' | 'sectors' | 'quarters' | 'sync_queue';

interface HiPipeDBSchema extends DBSchema {
  deals: {
    key: string;
    value: Deal;
  };
  clients: {
    key: string;
    value: CockpitClient;
  };
  stages: {
    key: string;
    value: Stage;
  };
  sectors: {
    key: string;
    value: CockpitSector;
  };
  quarters: {
    key: string;
    value: CockpitFinancialQuarter;
  };
  sync_queue: {
    key: number;
    value: SyncQueueEntry;
    autoIncrement: true;
  };
}

type DB = IDBPDatabase<HiPipeDBSchema>;

let dbPromise: Promise<DB> | null = null;

export function openDb(): Promise<DB> {
  if (!dbPromise) {
    dbPromise = openDB<HiPipeDBSchema>(DB_NAME, 1, {
      upgrade(database) {
        database.createObjectStore('deals', { keyPath: '_id' });
        database.createObjectStore('clients', { keyPath: '_id' });
        database.createObjectStore('stages', { keyPath: '_id' });
        database.createObjectStore('sectors', { keyPath: '_id' });
        database.createObjectStore('quarters', { keyPath: '_id' });
        database.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
      },
    });
  }

  return dbPromise;
}

export async function closeDb(): Promise<void> {
  if (!dbPromise) {
    return;
  }

  try {
    const db = await dbPromise;
    db.close();
  } finally {
    dbPromise = null;
  }
}

export async function getAll<T>(store: DataStoreName): Promise<T[]> {
  const db = await openDb();
  return db.getAll(store) as Promise<T[]>;
}

export async function putAll<T>(store: Exclude<DataStoreName, 'sync_queue'>, items: T[]): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(store, 'readwrite');
  for (const item of items) {
    // The object store keyPath handles the identifier.
    await tx.store.put(item as never);
  }
  await tx.done;
}

export async function put<T>(store: DataStoreName, item: T): Promise<void> {
  const db = await openDb();
  await db.put(store, item as never);
}

export async function remove(store: DataStoreName, id: string | number): Promise<void> {
  const db = await openDb();
  await db.delete(store, id as never);
}

export async function enqueue(entry: Omit<SyncQueueEntry, 'id'>): Promise<void> {
  const db = await openDb();
  await db.add('sync_queue', entry);
}

export async function getQueue(): Promise<SyncQueueEntry[]> {
  const db = await openDb();
  const items = await db.getAll('sync_queue');
  return items.sort((left, right) => {
    if (left.timestamp !== right.timestamp) {
      return left.timestamp - right.timestamp;
    }

    return (left.id ?? 0) - (right.id ?? 0);
  });
}

export async function clearQueue(): Promise<void> {
  const db = await openDb();
  await db.clear('sync_queue');
}
