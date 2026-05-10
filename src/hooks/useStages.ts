import { useCallback, useEffect, useState } from 'react';
import { createStage, updateStage, deleteStage } from '../lib/cockpit';
import { getAll } from '../lib/db';
import { seedCache } from '../lib/sync';
import { useOnlineStatus } from './useOnlineStatus';
import type { Stage } from '../types';

function sortStages(items: Stage[]): Stage[] {
  return [...items].sort((left: Stage, right: Stage) => left.sort_order - right.sort_order);
}

async function readStages(): Promise<Stage[]> {
  return sortStages(await getAll<Stage>('stages'));
}

export function useStages() {
  const { isOnline: browserOnline } = useOnlineStatus();
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(browserOnline);
  const [adding, setAdding] = useState<boolean>(false);
  const [editing, setEditing] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [addingError, setAddingError] = useState<string | null>(null);
  const [editingError, setEditingError] = useState<string | null>(null);
  const [deletingError, setDeletingError] = useState<string | null>(null);

  const reload = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      let storedStages = await getAll<Stage>('stages');
      if (storedStages.length === 0 && browserOnline) {
        await seedCache();
        storedStages = await getAll<Stage>('stages');
      }

      const sorted = sortStages(storedStages);
      setStages(sorted);
      setIsOnline(browserOnline);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load stages';
      setError(message);
      try {
        setStages(await readStages());
      } catch {
        setStages([]);
      }
      setIsOnline(false);
    } finally {
      setLoading(false);
    }
  }, [browserOnline]);

  const addStage = useCallback(async (data: Partial<Stage>): Promise<void> => {
    setAdding(true);
    setAddingError(null);

    try {
      await createStage(data);
      await reload();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add stage';
      setAddingError(message);
      throw err;
    } finally {
      setAdding(false);
    }
  }, [reload]);

  const editStage = useCallback(async (id: string, data: Partial<Stage>): Promise<void> => {
    setEditing(true);
    setEditingError(null);

    try {
      await updateStage(id, data);
      await reload();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to edit stage';
      setEditingError(message);
      throw err;
    } finally {
      setEditing(false);
    }
  }, [reload]);

  const removeStage = useCallback(async (id: string): Promise<void> => {
    setDeleting(true);
    setDeletingError(null);

    try {
      await deleteStage(id);
      await reload();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete stage';
      setDeletingError(message);
      throw err;
    } finally {
      setDeleting(false);
    }
  }, [reload]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    stages,
    loading,
    isLoading: loading,
    error,
    isOnline,
    adding,
    editing,
    deleting,
    addingError,
    editingError,
    deletingError,
    reload,
    addStage,
    editStage,
    removeStage,
  };
}
