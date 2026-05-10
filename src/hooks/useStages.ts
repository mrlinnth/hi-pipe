import { useState, useEffect } from 'react';
import { fetchStages, createStage, updateStage, deleteStage } from '../api/cockpit';
import type { Stage } from '../types';
import {
  isApiConfigured,
  getCachedStages, setCachedStages,
  localCreateStage, localUpdateStage, localDeleteStage,
} from '../storage';

export function useStages() {
  const [stages, setStages] = useState<Stage[]>(() => getCachedStages().sort((a: Stage, b: Stage) => a.sort_order - b.sort_order));
  const [loading, setLoading] = useState<boolean>(isApiConfigured());
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [adding, setAdding] = useState<boolean>(false);
  const [editing, setEditing] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [addingError, setAddingError] = useState<string | null>(null);
  const [editingError, setEditingError] = useState<string | null>(null);
  const [deletingError, setDeletingError] = useState<string | null>(null);

  const reload = async (): Promise<void> => {
    if (!isApiConfigured()) {
      const sorted = getCachedStages().sort((a: Stage, b: Stage) => a.sort_order - b.sort_order);
      setStages(sorted);
      setLoading(false);
      setIsOnline(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const result = await fetchStages();
      const sorted = result.items.sort((a: Stage, b: Stage) => a.sort_order - b.sort_order);
      setCachedStages(sorted);
      setStages(sorted);
      setIsOnline(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch stages';
      console.error('Failed to fetch stages:', message);
      setError(message);
      const sorted = getCachedStages().sort((a: Stage, b: Stage) => a.sort_order - b.sort_order);
      setStages(sorted);
      setIsOnline(false);
    } finally {
      setLoading(false);
    }
  };

  const addStage = async (data: Partial<Stage>): Promise<void> => {
    setAdding(true);
    setAddingError(null);
    try {
      if (isApiConfigured() && isOnline) {
        await createStage(data);
        await reload();
      } else {
        const newStage = localCreateStage(data);
        setStages((prev: Stage[]) => [...prev, newStage].sort((a: Stage, b: Stage) => a.sort_order - b.sort_order));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add stage';
      setAddingError(message);
      throw err;
    } finally {
      setAdding(false);
    }
  };

  const editStage = async (id: string, data: Partial<Stage>): Promise<void> => {
    setEditing(true);
    setEditingError(null);
    try {
      if (isApiConfigured() && isOnline) {
        await updateStage(id, data);
        await reload();
      } else {
        localUpdateStage(id, data);
        setStages((prev: Stage[]) =>
          prev.map((s: Stage) => s._id === id ? { ...s, ...data } : s)
              .sort((a: Stage, b: Stage) => a.sort_order - b.sort_order)
        );
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to edit stage';
      setEditingError(message);
      throw err;
    } finally {
      setEditing(false);
    }
  };

  const removeStage = async (id: string): Promise<void> => {
    setDeleting(true);
    setDeletingError(null);
    try {
      if (isApiConfigured() && isOnline) {
        await deleteStage(id);
        await reload();
      } else {
        localDeleteStage(id);
        setStages((prev: Stage[]) => prev.filter((s: Stage) => s._id !== id));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete stage';
      setDeletingError(message);
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
