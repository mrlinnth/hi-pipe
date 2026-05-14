import { useCallback, useEffect, useState } from 'react';
import { createStage, updateStage, deleteStage } from '../lib/cockpit';
import { getAll } from '../lib/db';
import {
  DEFAULT_STAGES,
  getCachedStages,
  localCreateStage,
  localDeleteStage,
  localUpdateStage,
  setCachedStages,
} from '../storage';
import { seedCache } from '../lib/sync';
import { useOnlineStatus } from './useOnlineStatus';
import type { Stage } from '../types';

const isTeamMode = import.meta.env.VITE_APP_MODE === 'team';

function sortStages(items: Stage[]): Stage[] {
  return [...items].sort((left: Stage, right: Stage) => left.sort_order - right.sort_order);
}

async function readTeamStages(): Promise<Stage[]> {
  return sortStages(await getAll<Stage>('stages'));
}

function readLocalStages(): Stage[] {
  return sortStages(getCachedStages());
}

export function useStages() {
  const { isOnline: browserOnline } = useOnlineStatus();
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(browserOnline);
  const [adding, setAdding] = useState<boolean>(false);
  const [editing, setEditing] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [addingError, setAddingError] = useState<string | null>(null);
  const [editingError, setEditingError] = useState<string | null>(null);
  const [deletingError, setDeletingError] = useState<string | null>(null);

  const reload = useCallback(async (options?: { background?: boolean }): Promise<void> => {
    const isBackgroundRefresh = options?.background ?? false;
    if (isBackgroundRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      if (!isTeamMode) {
        const storedStages = readLocalStages();
        if (storedStages.length === 0) {
          setCachedStages(DEFAULT_STAGES);
          setStages(sortStages(DEFAULT_STAGES));
        } else {
          setStages(storedStages);
        }
        setIsOnline(true);
        return;
      }

      let storedStages = await readTeamStages();
      if (storedStages.length === 0 && browserOnline) {
        await seedCache();
        storedStages = await readTeamStages();
      }

      setStages(storedStages);
      setIsOnline(browserOnline);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load stages';
      setError(message);
      try {
        setStages(isTeamMode ? await readTeamStages() : readLocalStages());
      } catch {
        setStages(isTeamMode ? [] : DEFAULT_STAGES);
      }
      setIsOnline(isTeamMode ? false : true);
    } finally {
      if (isBackgroundRefresh) {
        setIsRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [browserOnline]);

  const addStage = useCallback(async (data: Partial<Stage>): Promise<void> => {
    setAdding(true);
    setAddingError(null);

    try {
      if (isTeamMode) {
        await createStage(data);
      } else {
        localCreateStage(data);
      }
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
      if (isTeamMode) {
        await updateStage(id, data);
      } else {
        localUpdateStage(id, data);
      }
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
      if (isTeamMode) {
        await deleteStage(id);
      } else {
        localDeleteStage(id);
      }
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
    isRefreshing,
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
