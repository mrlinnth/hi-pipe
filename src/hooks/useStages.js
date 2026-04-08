import { useState, useEffect } from 'react';
import { fetchStages, createStage, updateStage, deleteStage } from '../api/cockpit';

export function useStages() {
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchStages();
      const sorted = result.items.sort((a, b) => a.sort_order - b.sort_order);
      setStages(sorted);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addStage = async (data) => {
    await createStage(data);
    await reload();
  };

  const editStage = async (id, data) => {
    await updateStage(id, data);
    await reload();
  };

  const removeStage = async (id) => {
    await deleteStage(id);
    await reload();
  };

  useEffect(() => {
    reload();
  }, []);

  return { stages, loading, error, reload, addStage, editStage, removeStage };
}
