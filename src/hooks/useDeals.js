import { useState, useEffect } from 'react';
import { fetchDeals, createDeal, updateDeal, deleteDeal } from '../api/cockpit';
import {
  isApiConfigured,
  getCachedDeals, setCachedDeals,
  localCreateDeal, localUpdateDeal, localDeleteDeal,
} from '../storage';

export function useDeals() {
  const [deals, setDeals] = useState(() => getCachedDeals());
  const [loading, setLoading] = useState(isApiConfigured());
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(false);

  const reload = async () => {
    if (!isApiConfigured()) {
      setDeals(getCachedDeals());
      setLoading(false);
      setIsOnline(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const result = await fetchDeals();
      setCachedDeals(result.items);
      setDeals(result.items);
      setIsOnline(true);
    } catch (err) {
      console.error('Failed to fetch deals:', err.message);
      setDeals(getCachedDeals());
      setIsOnline(false);
    } finally {
      setLoading(false);
    }
  };

  const addDeal = async (data) => {
    if (isApiConfigured() && isOnline) {
      await createDeal(data);
      await reload();
    } else {
      const newDeal = localCreateDeal(data);
      setDeals(prev => [...prev, newDeal]);
    }
  };

  const editDeal = async (id, data) => {
    if (isApiConfigured() && isOnline) {
      await updateDeal(id, data);
      await reload();
    } else {
      localUpdateDeal(id, data);
      setDeals(prev => prev.map(d => d._id === id ? { ...d, ...data } : d));
    }
  };

  const removeDeal = async (id) => {
    if (isApiConfigured() && isOnline) {
      await deleteDeal(id);
      await reload();
    } else {
      localDeleteDeal(id);
      setDeals(prev => prev.filter(d => d._id !== id));
    }
  };

  const moveDeal = async (id, newStageSlug) => {
    await editDeal(id, { stage: newStageSlug });
  };

  useEffect(() => {
    reload();
  }, []);

  return { deals, loading, error, isOnline, reload, addDeal, editDeal, removeDeal, moveDeal };
}
