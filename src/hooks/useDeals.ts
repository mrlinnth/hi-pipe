import { useCallback, useEffect, useState } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { createDeal as createRemoteDeal, deleteDeal as deleteRemoteDeal, updateDeal as updateRemoteDeal } from '../lib/cockpit';
import { enqueue, getAll, getQueue, put, remove } from '../lib/db';
import { seedCache } from '../lib/sync';
import { useOnlineStatus } from './useOnlineStatus';
import type { Deal } from '../types';

const isTeamMode = import.meta.env.VITE_APP_MODE === 'team';

function sortDeals(items: Deal[]): Deal[] {
  return [...items].sort((left, right) => {
    if ((left.sort_order ?? 0) !== (right.sort_order ?? 0)) {
      return (left.sort_order ?? 0) - (right.sort_order ?? 0);
    }

    return (left._created ?? 0) - (right._created ?? 0);
  });
}

function filterDealsForUser(items: Deal[], userId: string | null, userRole: string | null): Deal[] {
  if (!isTeamMode || userRole === 'management' || userRole === 'admin' || !userId) {
    return items;
  }

  return items.filter((deal: Deal) => deal.owner?._id === userId);
}

function buildTeamLocalDeal(data: Partial<Deal>, ownerId: string | null, ownerName: string): Deal {
  return {
    ...(data as Deal),
    _id: `temp_${crypto.randomUUID()}`,
    _pending: true,
    _created: Date.now(),
    ...(ownerId ? { owner: { _id: ownerId, name: ownerName } } : {}),
  };
}

function buildPersonalDeal(data: Partial<Deal>): Deal {
  return {
    ...(data as Deal),
    _id: `local_${crypto.randomUUID()}`,
    _created: Date.now(),
  };
}

async function readVisibleDeals(userId: string | null, userRole: string | null): Promise<Deal[]> {
  const storedDeals = await getAll<Deal>('deals');
  return filterDealsForUser(sortDeals(storedDeals), userId, userRole);
}

export function useDeals(userId?: string) {
  const { authState } = useAuthContext();
  const { isOnline: browserOnline } = useOnlineStatus();
  const effectiveUserId = userId ?? authState?.userId ?? null;
  const userRole = authState?.userRole ?? null;
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(browserOnline);
  const [saving, setSaving] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [savingError, setSavingError] = useState<string | null>(null);
  const [deletingError, setDeletingError] = useState<string | null>(null);
  const [queueCount, setQueueCount] = useState<number>(0);

  const refreshQueueCount = useCallback(async (): Promise<number> => {
    if (!isTeamMode) {
      setQueueCount(0);
      return 0;
    }

    const queue = await getQueue();
    setQueueCount(queue.length);
    return queue.length;
  }, []);

  const refreshFromStore = useCallback(async (): Promise<Deal[]> => {
    const visibleDeals = await readVisibleDeals(effectiveUserId, userRole);
    setDeals(visibleDeals);
    return visibleDeals;
  }, [effectiveUserId, userRole]);

  const reload = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      if (!isTeamMode) {
        const storedDeals = await getAll<Deal>('deals');
        const visibleDeals = filterDealsForUser(sortDeals(storedDeals), effectiveUserId, userRole);
        setDeals(visibleDeals);
        setIsOnline(true);
        return;
      }

      let storedDeals = await getAll<Deal>('deals');
      if (storedDeals.length === 0 && browserOnline) {
        await seedCache();
        storedDeals = await getAll<Deal>('deals');
      }

      const visibleDeals = filterDealsForUser(sortDeals(storedDeals), effectiveUserId, userRole);
      setDeals(visibleDeals);
      setIsOnline(browserOnline);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load deals';
      setError(message);
      try {
        const visibleDeals = await readVisibleDeals(effectiveUserId, userRole);
        setDeals(visibleDeals);
      } catch {
        setDeals([]);
      }
      setIsOnline(isTeamMode ? false : true);
    } finally {
      setLoading(false);
      await refreshQueueCount();
    }
  }, [browserOnline, effectiveUserId, refreshQueueCount, userRole]);

  const addDeal = useCallback(async (data: Partial<Deal>): Promise<void> => {
    setSaving(true);
    setSavingError(null);

    try {
      if (!isTeamMode) {
        const localDeal = buildPersonalDeal(data);
        await put('deals', localDeal);
      } else if (browserOnline) {
        const created = await createRemoteDeal(data, isTeamMode ? effectiveUserId ?? undefined : undefined);
        await put('deals', created);
      } else {
        const localDeal = buildTeamLocalDeal(data, isTeamMode ? effectiveUserId : null, authState?.userName ?? '');
        await put('deals', localDeal);
        await enqueue({
          action: 'create',
          collection: 'deals',
          payload: localDeal,
          tempId: localDeal._id,
          timestamp: Date.now(),
        });
      }

      await refreshFromStore();
      await refreshQueueCount();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save deal';
      setSavingError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [authState?.userName, browserOnline, effectiveUserId, refreshFromStore, refreshQueueCount]);

  const editDeal = useCallback(async (id: string, data: Partial<Deal>): Promise<void> => {
    setSaving(true);
    setSavingError(null);

    try {
      const storedDeals = await getAll<Deal>('deals');
      const existingDeal = storedDeals.find((deal: Deal) => deal._id === id);
      const baseDeal = existingDeal ?? ({ _id: id } as Deal);
      const nextDeal: Deal = {
        ...baseDeal,
        ...(data as Deal),
        _id: id,
        _pending: isTeamMode ? (existingDeal?._pending ? true : !browserOnline) : existingDeal?._pending,
      };

      if (!isTeamMode) {
        const personalDeal = { ...nextDeal };
        delete personalDeal._pending;
        await put('deals', personalDeal);
      } else if (browserOnline && !existingDeal?._pending) {
        const updated = await updateRemoteDeal(id, data);
        await put('deals', updated);
      } else {
        await put('deals', nextDeal);
        await enqueue({
          action: 'update',
          collection: 'deals',
          payload: nextDeal,
          timestamp: Date.now(),
        });
      }

      await refreshFromStore();
      await refreshQueueCount();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update deal';
      setSavingError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [browserOnline, refreshFromStore, refreshQueueCount]);

  const removeDeal = useCallback(async (id: string): Promise<void> => {
    setDeleting(true);
    setDeletingError(null);

    try {
      const storedDeals = await getAll<Deal>('deals');
      const existingDeal = storedDeals.find((deal: Deal) => deal._id === id);

      if (!isTeamMode) {
        await remove('deals', id);
      } else if (browserOnline && !existingDeal?._pending) {
        await deleteRemoteDeal(id);
        await remove('deals', id);
      } else {
        if (existingDeal) {
          await enqueue({
            action: 'delete',
            collection: 'deals',
            payload: { _id: id, ...existingDeal },
            timestamp: Date.now(),
          });
        }
        await remove('deals', id);
      }

      await refreshFromStore();
      await refreshQueueCount();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete deal';
      setDeletingError(message);
      throw err;
    } finally {
      setDeleting(false);
    }
  }, [browserOnline, refreshFromStore, refreshQueueCount]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    deals,
    loading,
    isLoading: loading,
    error,
    isOnline,
    saving,
    deleting,
    savingError,
    deletingError,
    queueCount,
    refreshQueueCount,
    reload,
    addDeal,
    createDeal: addDeal,
    editDeal,
    updateDeal: editDeal,
    removeDeal,
    deleteDeal: removeDeal,
  };
}
