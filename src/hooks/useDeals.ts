import { useState, useEffect } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { fetchDeals, createDeal, updateDeal, deleteDeal } from '../lib/cockpit';
import type { Deal } from '../types';
import {
  isApiConfigured,
  getCachedDeals, setCachedDeals,
  localCreateDeal, localUpdateDeal, localDeleteDeal,
} from '../storage';

const isTeamMode = import.meta.env.VITE_APP_MODE === 'team';

function filterDealsForUser(items: Deal[], userId: string | null, userRole: string | null): Deal[] {
  if (!isTeamMode || userRole === 'management' || userRole === 'admin' || !userId) {
    return items;
  }

  return items.filter((deal: Deal) => deal.owner?._id === userId);
}

export function useDeals(userId?: string) {
  const { authState } = useAuthContext();
  const effectiveUserId = userId ?? authState?.userId ?? null;
  const userRole = authState?.userRole ?? null;
  const [deals, setDeals] = useState<Deal[]>(() => getCachedDeals());
  const [loading, setLoading] = useState<boolean>(isApiConfigured());
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [savingError, setSavingError] = useState<string | null>(null);
  const [deletingError, setDeletingError] = useState<string | null>(null);

  const reload = async (): Promise<void> => {
    if (!isApiConfigured()) {
      setDeals(filterDealsForUser(getCachedDeals(), effectiveUserId, userRole));
      setLoading(false);
      setIsOnline(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const result = await fetchDeals(isTeamMode ? effectiveUserId ?? undefined : undefined);
      const visibleDeals = filterDealsForUser(result, effectiveUserId, userRole);
      setCachedDeals(result);
      setDeals(visibleDeals);
      setIsOnline(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch deals';
      console.error('Failed to fetch deals:', message);
      setError(message);
      setDeals(filterDealsForUser(getCachedDeals(), effectiveUserId, userRole));
      setIsOnline(false);
    } finally {
      setLoading(false);
    }
  };

  const addDeal = async (data: Partial<Deal>): Promise<void> => {
    setSaving(true);
    setSavingError(null);
    try {
      if (isApiConfigured() && isOnline) {
        await createDeal(data, isTeamMode ? effectiveUserId ?? undefined : undefined);
        await reload();
      } else {
        const newDeal = localCreateDeal(data, isTeamMode ? effectiveUserId ?? undefined : undefined);
        setDeals((prev: Deal[]) => [...prev, newDeal]);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save deal';
      setSavingError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const editDeal = async (id: string, data: Partial<Deal>): Promise<void> => {
    setSaving(true);
    setSavingError(null);
    try {
      if (isApiConfigured() && isOnline) {
        await updateDeal(id, data);
        await reload();
      } else {
        localUpdateDeal(id, data);
        setDeals((prev: Deal[]) => prev.map((d: Deal) => d._id === id ? { ...d, ...data } : d));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update deal';
      setSavingError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const removeDeal = async (id: string): Promise<void> => {
    setDeleting(true);
    setDeletingError(null);
    try {
      if (isApiConfigured() && isOnline) {
        await deleteDeal(id);
        await reload();
      } else {
        localDeleteDeal(id);
        setDeals((prev: Deal[]) => prev.filter((d: Deal) => d._id !== id));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete deal';
      setDeletingError(message);
      throw err;
    } finally {
      setDeleting(false);
    }
  };

  const moveDeal = async (id: string, newStageSlug: string): Promise<void> => {
    await editDeal(id, { stage: newStageSlug });
  };

  useEffect(() => {
    reload();
  }, [effectiveUserId, userRole]);

  return { deals, loading, error, isOnline, saving, deleting, savingError, deletingError, reload, addDeal, editDeal, removeDeal, moveDeal };
}
