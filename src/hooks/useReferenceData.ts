import { useCallback, useEffect, useState } from 'react';
import { getAll } from '../lib/db';
import { seedCache } from '../lib/sync';
import { useOnlineStatus } from './useOnlineStatus';
import type { CockpitClient, CockpitFinancialQuarter, CockpitSector } from '../types';

type ReferenceDataState = {
  clients: CockpitClient[];
  sectors: CockpitSector[];
  quarters: CockpitFinancialQuarter[];
  isLoading: boolean;
  refresh: () => Promise<void>;
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

  const applyReferenceData = useCallback((data: {
    clients: CockpitClient[];
    sectors: CockpitSector[];
    quarters: CockpitFinancialQuarter[];
  }) => {
    setClients(data.clients);
    setSectors(data.sectors);
    setQuarters(data.quarters);
  }, []);

  const load = useCallback(async (): Promise<void> => {
    setIsLoading(true);

    try {
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
      setIsLoading(false);
    }
  }, [applyReferenceData, browserOnline]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    clients,
    sectors,
    quarters,
    isLoading,
    refresh: async () => {
      await load();
    },
  };
}
