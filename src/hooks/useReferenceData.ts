import { useCallback, useEffect, useState } from 'react';
import { fetchClients, fetchFinancialQuarters, fetchSectors } from '../lib/cockpit';
import type { CockpitClient, CockpitFinancialQuarter, CockpitSector } from '../types';
import { getApiConfig } from '../storage';

type ReferenceCache = {
  timestamp: number;
  clients: CockpitClient[];
  sectors: CockpitSector[];
  quarters: CockpitFinancialQuarter[];
};

type ReferenceDataState = {
  clients: CockpitClient[];
  sectors: CockpitSector[];
  quarters: CockpitFinancialQuarter[];
  isLoading: boolean;
  refresh: () => Promise<void>;
};

const CACHE_KEY = 'hi_pipe_ref_cache';
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function readCache(): ReferenceCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    const candidate = parsed as Partial<ReferenceCache>;
    if (
      typeof candidate.timestamp !== 'number'
      || !Array.isArray(candidate.clients)
      || !Array.isArray(candidate.sectors)
      || !Array.isArray(candidate.quarters)
    ) {
      return null;
    }

    return candidate as ReferenceCache;
  } catch {
    return null;
  }
}

function writeCache(cache: ReferenceCache): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore cache write failures.
  }
}

function isFresh(cache: ReferenceCache): boolean {
  return Date.now() - cache.timestamp < CACHE_MAX_AGE_MS;
}

export function useReferenceData(): ReferenceDataState {
  const [clients, setClients] = useState<CockpitClient[]>([]);
  const [sectors, setSectors] = useState<CockpitSector[]>([]);
  const [quarters, setQuarters] = useState<CockpitFinancialQuarter[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const applyCache = useCallback((cache: ReferenceCache) => {
    setClients(cache.clients);
    setSectors(cache.sectors);
    setQuarters(cache.quarters);
  }, []);

  const load = useCallback(async (forceRefresh = false) => {
    const config = getApiConfig();
    const cache = readCache();

    if (!forceRefresh && cache && isFresh(cache)) {
      applyCache(cache);
      setIsLoading(false);
      return;
    }

    if (!config.url.trim() || !config.key.trim()) {
      if (cache) {
        applyCache(cache);
      }
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [nextClients, nextSectors, nextQuarters] = await Promise.all([
        fetchClients(),
        fetchSectors(),
        fetchFinancialQuarters(),
      ]);

      const nextCache: ReferenceCache = {
        timestamp: Date.now(),
        clients: nextClients,
        sectors: nextSectors,
        quarters: nextQuarters,
      };
      applyCache(nextCache);
      writeCache(nextCache);
    } catch (err) {
      console.error('Failed to load reference data:', err);
      if (cache) {
        applyCache(cache);
      }
    } finally {
      setIsLoading(false);
    }
  }, [applyCache]);

  useEffect(() => {
    void load(false);
  }, [load]);

  return {
    clients,
    sectors,
    quarters,
    isLoading,
    refresh: async () => {
      await load(true);
    },
  };
}
