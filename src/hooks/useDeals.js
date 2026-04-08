import { useState, useEffect } from 'react';
import { fetchDeals, createDeal, updateDeal, deleteDeal } from '../api/cockpit';

export function useDeals() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchDeals();
      setDeals(result.items);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addDeal = async (data) => {
    await createDeal(data);
    await reload();
  };

  const editDeal = async (id, data) => {
    await updateDeal(id, data);
    await reload();
  };

  const removeDeal = async (id) => {
    await deleteDeal(id);
    await reload();
  };

  const moveDeal = async (id, newStageSlug) => {
    await updateDeal(id, { stage: newStageSlug });
    await reload();
  };

  useEffect(() => {
    reload();
  }, []);

  return { deals, loading, error, reload, addDeal, editDeal, removeDeal, moveDeal };
}
