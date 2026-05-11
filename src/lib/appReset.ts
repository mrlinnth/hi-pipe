import { DB_NAME, closeDb } from './db';

function deleteIndexedDb(name: string): Promise<void> {
  return new Promise((resolve) => {
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });
}

export async function clearAppData(): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.clear();
  sessionStorage.clear();

  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    } catch {
      // Ignore browsers that block service worker cleanup.
    }
  }

  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }

  await closeDb();

  const databaseNames = new Set<string>();
  databaseNames.add(DB_NAME);

  if ('databases' in indexedDB) {
    try {
      const databases = await indexedDB.databases();
      for (const database of databases) {
        if (database.name) {
          databaseNames.add(database.name);
        }
      }
    } catch {
      // Ignore browsers that expose the API but reject the call.
    }
  }

  await Promise.all([...databaseNames].map((name) => deleteIndexedDb(name)));
}
