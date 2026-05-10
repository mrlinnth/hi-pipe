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
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [savingError, setSavingError] = useState(null);
  const [deletingError, setDeletingError] = useState(null);

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
      setError(err.message);
      setDeals(getCachedDeals());
      setIsOnline(false);
    } finally {
      setLoading(false);
    }
  };

  const addDeal = async (data) => {
    setSaving(true);
    setSavingError(null);
    try {
      if (isApiConfigured() && isOnline) {
        await createDeal(data);
        await reload();
      } else {
        const newDeal = localCreateDeal(data);
        setDeals(prev => [...prev, newDeal]);
      }
    } catch (err) {
      setSavingError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const editDeal = async (id, data) => {
    setSaving(true);
    setSavingError(null);
    try {
      if (isApiConfigured() && isOnline) {
        await updateDeal(id, data);
        await reload();
      } else {
        localUpdateDeal(id, data);
        setDeals(prev => prev.map(d => d._id === id ? { ...d, ...data } : d));
      }
    } catch (err) {
      setSavingError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const removeDeal = async (id) => {
    setDeleting(true);
    setDeletingError(null);
    try {
      if (isApiConfigured() && isOnline) {
        await deleteDeal(id);
        await reload();
      } else {
        localDeleteDeal(id);
        setDeals(prev => prev.filter(d => d._id !== id));
      }
    } catch (err) {
      setDeletingError(err.message);
      throw err;
    } finally {
      setDeleting(false);
    }
  };

  const moveDeal = async (id, newStageSlug) => {
    await editDeal(id, { stage: newStageSlug });
  };

  useEffect(() => {
    reload();
  }, []);

  return { deals, loading, error, isOnline, saving, deleting, savingError, deletingError, reload, addDeal, editDeal, removeDeal, moveDeal };
}
