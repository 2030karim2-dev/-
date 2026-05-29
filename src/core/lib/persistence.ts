import { del, get, set } from 'idb-keyval';
import type { Persister } from '@tanstack/react-query-persist-client';

/**
 * Creates an IndexedDB persister for TanStack Query
 * This allows the app to load data from the local database when offline.
 *
 * Note: localStoragePersister was removed because IndexedDB is universally
 * supported in our target environments and avoids the 5MB limit + sync IO of localStorage.
 */
export function createIndexedDBPersister(idbKey = 'alzhra-query-cache'): Persister {
    return {
        persistClient: async (client) => {
            await set(idbKey, client);
        },
        restoreClient: async () => {
            return await get(idbKey);
        },
        removeClient: async () => {
            await del(idbKey);
        },
    };
}
