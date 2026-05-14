import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { useAuthContext } from './context/AuthContext';
import { LoginScreen } from './components/LoginScreen';
import { useAuth } from './hooks/useAuth';
import { useDeals } from './hooks/useDeals';
import { useStages } from './hooks/useStages';
import { useReferenceData } from './hooks/useReferenceData';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { FilterBar } from './components/FilterBar';
import { TotalsBar } from './components/TotalsBar';
import { Board } from './components/Board';
import { DealModal } from './components/DealModal';
import { SettingsPanel } from './components/SettingsPanel';
import { SyncStatusBar } from './components/SyncStatusBar';
import { getSectors, saveSectors, resetSectors, DEFAULT_SECTORS, DEFAULT_PERIODS } from './storage';
import { clearAppData } from './lib/appReset';
import { syncNow } from './lib/sync';
import { exportDeals } from './lib/export';
import { getAppName } from './lib/appName';
import type { Deal, Stage } from './types';

type ActiveFilters = {
  period: string | null;
  sector: string | null;
  tag: string | null;
};

type SettingsTab = 'connection' | 'stages' | 'sectors';

const isTeamMode = import.meta.env.VITE_APP_MODE === 'team';
const appName = getAppName();
const TEAM_SYNC_POLL_INTERVAL_MS = 60_000;
type SyncSource = 'manual' | 'startup' | 'interval';

function MainApp() {
  const { authState } = useAuthContext();
  const { isOnline: browserOnline } = useOnlineStatus();
  const {
    deals,
    loading: dealsLoading,
    saving,
    deleting,
    addDeal,
    editDeal,
    removeDeal,
    isOnline: dealsOnline,
    queueCount,
    refreshQueueCount,
    reload: reloadDeals,
  } = useDeals(authState?.userId);
  const {
    stages,
    loading: stagesLoading,
    error: stagesError,
    addStage,
    editStage,
    removeStage,
    isOnline: stagesOnline,
    reload: reloadStages,
  } = useStages();
  const { clients, sectors: refSectors, quarters, refresh: refreshReferenceData } = useReferenceData();
  const isOnline = isTeamMode ? dealsOnline && stagesOnline : true;

  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
    period: null,
    sector: null,
    tag: null,
  });
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('stages');
  const [sectors, setSectors] = useState<string[]>(() => (isTeamMode ? [] : getSectors()));
  const [showTags, setShowTags] = useState<boolean>(false);
  const [compactCards, setCompactCards] = useState<boolean>(false);
  const [dealModalError, setDealModalError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncErrorCount, setSyncErrorCount] = useState<number>(0);
  const [isResettingApp, setIsResettingApp] = useState<boolean>(false);
  const syncTimerRef = useRef<number | null>(null);
  const syncInFlightRef = useRef<boolean>(false);

  const clearSyncTimer = useCallback(() => {
    if (syncTimerRef.current !== null) {
      window.clearTimeout(syncTimerRef.current);
      syncTimerRef.current = null;
    }
  }, []);

  const handleSync = useCallback(async (source: SyncSource = 'manual') => {
    if (!isTeamMode || !browserOnline || syncInFlightRef.current) {
      return;
    }

    const isManual = source === 'manual';
    syncInFlightRef.current = true;
    if (isManual) {
      clearSyncTimer();
      setSyncStatus('syncing');
      setSyncErrorCount(0);
    }

    try {
      const syncUserId = authState?.userRole === 'management' || authState?.userRole === 'admin'
        ? undefined
        : authState?.userId;
      const result = await syncNow(syncUserId);
      await Promise.all([
        reloadDeals({ background: true }),
        reloadStages({ background: true }),
        refreshReferenceData({ background: true }),
        refreshQueueCount(),
      ]);

      if (result.success) {
        if (isManual) {
          setSyncStatus('success');
          syncTimerRef.current = window.setTimeout(() => {
            setSyncStatus('idle');
            syncTimerRef.current = null;
          }, 1600);
        } else {
          setSyncErrorCount(0);
          setSyncStatus('idle');
        }
      } else {
        setSyncErrorCount(result.errors.length);
        setSyncStatus('error');
      }
    } catch (err) {
      setSyncErrorCount(1);
      setSyncStatus('error');
      console.error('Sync failed:', err);
    } finally {
      syncInFlightRef.current = false;
    }
  }, [
    authState?.userId,
    authState?.userRole,
    browserOnline,
    clearSyncTimer,
    refreshQueueCount,
    refreshReferenceData,
    reloadDeals,
    reloadStages,
  ]);

  useEffect(() => () => clearSyncTimer(), [clearSyncTimer]);

  useEffect(() => {
    if (!isTeamMode || !browserOnline) {
      return;
    }

    void handleSync('startup');
    const intervalId = window.setInterval(() => {
      void handleSync('interval');
    }, TEAM_SYNC_POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [browserOnline, handleSync]);

  const handleManualSync = useCallback(() => {
    void handleSync('manual');
  }, [handleSync]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setActiveFilters({
      period: params.get('period') || null,
      sector: params.get('sector') || null,
      tag: params.get('tag') || null,
    });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (activeFilters.period) params.set('period', activeFilters.period);
    if (activeFilters.sector) params.set('sector', activeFilters.sector);
    if (activeFilters.tag) params.set('tag', activeFilters.tag);
    const newSearch = params.toString();
    if (newSearch !== window.location.search.slice(1)) {
      window.history.replaceState({}, '', `?${newSearch}`);
    }
  }, [activeFilters]);

  const filteredDeals = deals.filter((deal: Deal) => {
    if (activeFilters.period && deal.period !== activeFilters.period) return false;
    if (activeFilters.sector && deal.sector !== activeFilters.sector) return false;
    if (activeFilters.tag) {
      const tags = deal.tags ? deal.tags.split(',').map((t: string) => t.trim()) : [];
      if (!tags.includes(activeFilters.tag)) return false;
    }
    return true;
  });

  const availableTags = Array.from(
    new Set(
      deals.flatMap(deal => (deal.tags ? deal.tags.split(',').map((t: string) => t.trim()) : []))
    )
  ).sort();

  const handleFilterChange = (filterType: keyof ActiveFilters, value: string | null) => {
    setActiveFilters((prev: ActiveFilters) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const handleDealClick = (deal: Deal) => {
    setSelectedDeal(deal);
  };

  const handleDealSave = async (data: Partial<Deal>) => {
    setDealModalError(null);
    try {
      if (selectedDeal) {
        await editDeal(selectedDeal._id, data);
      } else {
        await addDeal(data);
      }
    } catch (err: unknown) {
      setDealModalError(err instanceof Error ? err.message : 'Failed to save deal');
      throw err;
    }
  };

  const handleDealDelete = async (id: string) => {
    setDealModalError(null);
    try {
      await removeDeal(id);
    } catch (err: unknown) {
      setDealModalError(err instanceof Error ? err.message : 'Failed to delete deal');
      throw err;
    }
  };

  const dealCounts = stages.reduce<Record<string, number>>((acc, stage: Stage) => {
    acc[stage.slug] = deals.filter((d: Deal) => d.stage === stage.slug).length;
    return acc;
  }, {});

  const openSettings = (tab: SettingsTab = 'stages') => {
    setSettingsTab(tab);
    setIsSettingsOpen(true);
  };

  const handleResetApp = async () => {
    const shouldUpdate = window.confirm(
      'This will clear saved app data and reload the app so you can pick up the latest release.',
    );

    if (!shouldUpdate) {
      return;
    }

    setIsResettingApp(true);

    try {
      await clearAppData();
    } catch (err) {
      console.error('Failed to clear app data:', err);
    } finally {
      window.location.reload();
    }
  };

  const handleSectorAdd = (name: string) => {
    if (isTeamMode) return;
    const next = [...sectors, name];
    setSectors(next);
    saveSectors(next);
  };

  const handleSectorRename = (i: number, name: string) => {
    if (isTeamMode) return;
    const next = sectors.map((s: string, j: number) => (j === i ? name : s));
    setSectors(next);
    saveSectors(next);
  };

  const handleSectorDelete = (i: number) => {
    if (isTeamMode) return;
    const next = sectors.filter((_: string, j: number) => j !== i);
    setSectors(next);
    saveSectors(next);
  };

  const handleSectorReset = () => {
    if (isTeamMode) return;
    resetSectors();
    setSectors(DEFAULT_SECTORS);
  };

  const handleStageReorder = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = stages.findIndex((s: Stage) => s._id === id);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= stages.length) return;

    const currentStage = stages[currentIndex];
    const targetStage = stages[newIndex];

    await editStage(currentStage._id, { sort_order: newIndex + 1 });
    await editStage(targetStage._id, { sort_order: currentIndex + 1 });
  };

  const sectorOptions = useMemo(
    () => (isTeamMode ? refSectors.map((sector) => sector.name) : sectors),
    [refSectors, sectors],
  );
  const periodOptions = useMemo(
    () => (isTeamMode ? quarters.map((quarter) => quarter.name) : DEFAULT_PERIODS),
    [quarters],
  );
  const clientOptions = useMemo(
    () => (isTeamMode ? clients : []),
    [clients],
  );

  if (dealsLoading || stagesLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <img src="/icon-192.png" alt={appName} className="brand-icon" />
          <h1>{appName}</h1>
        </div>
        <div className="header-actions">
          <span className={`connection-badge ${isTeamMode ? (isOnline ? 'online' : 'offline') : 'local'}`}>
            {isTeamMode ? (isOnline ? 'Online' : 'Offline') : 'Local'}
          </span>
          {authState?.msEmail && <span className="header-user-email">{authState.msEmail}</span>}
          <button className="btn-settings" onClick={() => openSettings('stages')} aria-label="Settings">⚙️</button>
        </div>
      </header>

      {isTeamMode && (
        <SyncStatusBar
          isOnline={browserOnline}
          pendingCount={queueCount}
          status={syncStatus}
          errorCount={syncErrorCount}
          onSync={handleManualSync}
          onRetry={handleManualSync}
        />
      )}

      <FilterBar
        activePeriod={activeFilters.period}
        activeSector={activeFilters.sector}
        activeTag={activeFilters.tag}
        onPeriodChange={(value: string | null) => handleFilterChange('period', value)}
        onSectorChange={(value: string | null) => handleFilterChange('sector', value)}
        onTagChange={(value: string | null) => handleFilterChange('tag', value)}
        onExportCsv={() => exportDeals(filteredDeals, 'csv')}
        onExportExcel={() => exportDeals(filteredDeals, 'xlsx')}
        availableTags={availableTags}
        sectors={sectorOptions}
        periods={periodOptions}
      />

      <TotalsBar
        deals={filteredDeals}
        showTags={showTags}
        setShowTags={setShowTags}
        compactCards={compactCards}
        setCompactCards={setCompactCards}
      />

      <Board
        stages={stages}
        deals={filteredDeals}
        onDealClick={handleDealClick}
        showTags={showTags}
        compactCards={compactCards}
      />

      <button className="btn-add-deal" onClick={() => setIsAddModalOpen(true)}>+ Add Deal</button>

      {(selectedDeal !== null || isAddModalOpen) && (
        <DealModal
          deal={selectedDeal}
          stages={stages}
          sectors={sectorOptions}
          periods={periodOptions}
          clients={clientOptions}
          onSave={handleDealSave}
          onDelete={handleDealDelete}
          onClose={() => {
            setSelectedDeal(null);
            setIsAddModalOpen(false);
            setDealModalError(null);
          }}
          saving={saving}
          deleting={deleting}
          error={dealModalError}
        />
      )}

      {isSettingsOpen && (
        <SettingsPanel
          initialTab={settingsTab}
          stages={stages}
          onAdd={addStage}
          onEdit={editStage}
          onDelete={removeStage}
          onReorder={handleStageReorder}
          dealCounts={dealCounts}
          sectors={sectors}
          onSectorAdd={handleSectorAdd}
          onSectorRename={handleSectorRename}
          onSectorDelete={handleSectorDelete}
          onSectorReset={handleSectorReset}
          onResetApp={handleResetApp}
          isResettingApp={isResettingApp}
          isOnline={isOnline}
          connectionError={stagesError}
          isTeamMode={isTeamMode}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
}

function App() {
  const auth = useAuth();

  return (
    <AuthProvider value={auth}>
      {isTeamMode && !auth.authState ? (
        <LoginScreen
          isLoading={auth.isLoading}
          error={auth.error}
          errorReason={auth.errorReason}
          onLogin={auth.login}
        />
      ) : (
        <MainApp />
      )}
    </AuthProvider>
  );
}

export default App;
