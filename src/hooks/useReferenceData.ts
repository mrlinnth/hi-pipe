import { useCallback, useEffect, useState } from 'react';
import { getAll } from '../lib/db';
import { seedCache } from '../lib/sync';
import { filterCurrentYearQuarters } from '../lib/referenceData';
import { useOnlineStatus } from './useOnlineStatus';
import type { CockpitClient, CockpitFinancialQuarter, CockpitSector } from '../types';

const isTeamMode = import.meta.env.VITE_APP_MODE === 'team';

type ReferenceDataState = {
  clients: CockpitClient[];
  sectors: CockpitSector[];
  quarters: CockpitFinancialQuarter[];
  isLoading: boolean;
  isRefreshing: boolean;
  refresh: (options?: { background?: boolean }) => Promise<void>;
};

async function readReferenceData(): Promise<{
  clients: CockpitClient[];
  sectors: CockpitSector[];
  quarters: CockpitFinancialQuarter[];
}> {
  const [clients, sectors, quarters] = await Promise.all([
    getAll<CockpitClient>('clients'),
    getAll<CockpitSector>('sectors'),
    getAll<CockpitFinancialQuarter>('quarters'),
  ]);

  return { clients, sectors, quarters };
}

export function useReferenceData(): ReferenceDataState {
  const { isOnline: browserOnline } = useOnlineStatus();
  const [clients, setClients] = useState<CockpitClient[]>([]);
  const [sectors, setSectors] = useState<CockpitSector[]>([]);
  const [quarters, setQuarters] = useState<CockpitFinancialQuarter[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const applyReferenceData = useCallback((data: {
    clients: CockpitClient[];
    sectors: CockpitSector[];
    quarters: CockpitFinancialQuarter[];
  }) => {
    setClients(data.clients);
    setSectors(data.sectors);
    setQuarters(filterCurrentYearQuarters(data.quarters));
  }, []);

  const load = useCallback(async (options?: { background?: boolean }): Promise<void> => {
    const isBackgroundRefresh = options?.background ?? false;
    if (isBackgroundRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      if (!isTeamMode) {
        applyReferenceData({ clients: [], sectors: [], quarters: [] });
        return;
      }

      let data = await readReferenceData();
      if (browserOnline && data.clients.length === 0 && data.sectors.length === 0 && data.quarters.length === 0) {
        await seedCache();
        data = await readReferenceData();
      }

      applyReferenceData(data);
    } catch (err) {
      console.error('Failed to load reference data:', err);
      try {
        applyReferenceData(await readReferenceData());
      } catch {
        applyReferenceData({ clients: [], sectors: [], quarters: [] });
      }
    } finally {
      if (isBackgroundRefresh) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [applyReferenceData, browserOnline]);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = useCallback(async (options?: { background?: boolean }): Promise<void> => {
    await load(options);
  }, [load]);

  return {
    clients,
    sectors,
    quarters,
    isLoading,
    isRefreshing,
    refresh,
  };
}
