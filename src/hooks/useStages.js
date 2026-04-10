import { useState, useEffect } from 'react';
import { fetchStages, createStage, updateStage, deleteStage } from '../api/cockpit';
import {
  isApiConfigured,
  getCachedStages, setCachedStages,
  localCreateStage, localUpdateStage, localDeleteStage,
} from '../storage';

export function useStages() {
  const [stages, setStages] = useState(() => getCachedStages().sort((a, b) => a.sort_order - b.sort_order));
  const [loading, setLoading] = useState(isApiConfigured());
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [addingError, setAddingError] = useState(null);
  const [editingError, setEditingError] = useState(null);
  const [deletingError, setDeletingError] = useState(null);

  const reload = async () => {
    if (!isApiConfigured()) {
      const sorted = getCachedStages().sort((a, b) => a.sort_order - b.sort_order);
      setStages(sorted);
      setLoading(false);
      setIsOnline(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const result = await fetchStages();
      const sorted = result.items.sort((a, b) => a.sort_order - b.sort_order);
      setCachedStages(sorted);
      setStages(sorted);
      setIsOnline(true);
    } catch (err) {
      console.error('Failed to fetch stages:', err.message);
      setError(err.message);
      const sorted = getCachedStages().sort((a, b) => a.sort_order - b.sort_order);
      setStages(sorted);
      setIsOnline(false);
    } finally {
      setLoading(false);
    }
  };

  const addStage = async (data) => {
    setAdding(true);
    setAddingError(null);
    try {
      if (isApiConfigured() && isOnline) {
        await createStage(data);
        await reload();
      } else {
        const newStage = localCreateStage(data);
        setStages(prev => [...prev, newStage].sort((a, b) => a.sort_order - b.sort_order));
      }
    } catch (err) {
      setAddingError(err.message);
      throw err;
    } finally {
      setAdding(false);
    }
  };

  const editStage = async (id, data) => {
    setEditing(true);
    setEditingError(null);
    try {
      if (isApiConfigured() && isOnline) {
        await updateStage(id, data);
        await reload();
      } else {
        localUpdateStage(id, data);
        setStages(prev =>
          prev.map(s => s._id === id ? { ...s, ...data } : s)
              .sort((a, b) => a.sort_order - b.sort_order)
        );
      }
    } catch (err) {
      setEditingError(err.message);
      throw err;
    } finally {
      setEditing(false);
    }
  };

  const removeStage = async (id) => {
    setDeleting(true);
    setDeletingError(null);
    try {
      if (isApiConfigured() && isOnline) {
        await deleteStage(id);
        await reload();
      } else {
        localDeleteStage(id);
        setStages(prev => prev.filter(s => s._id !== id));
      }
    } catch (err) {
      setDeletingError(err.message);
      throw err;
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  return { stages, loading, error, isOnline, adding, editing, deleting, addingError, editingError, deletingError, reload, addStage, editStage, removeStage };
}
