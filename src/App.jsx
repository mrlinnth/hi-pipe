import { useState, useEffect } from 'react';
import { useDeals } from './hooks/useDeals';
import { useStages } from './hooks/useStages';
import { FilterBar } from './components/FilterBar';
import { TotalsBar } from './components/TotalsBar';
import { Board } from './components/Board';
import { DealModal } from './components/DealModal';
import { SettingsPanel } from './components/SettingsPanel';
import { WelcomeModal } from './components/WelcomeModal';
import { getSectors, saveSectors, resetSectors, DEFAULT_SECTORS } from './storage';

function App() {
  const { deals, loading: dealsLoading, addDeal, editDeal, removeDeal, moveDeal, isOnline: dealsOnline } = useDeals();
  const { stages, loading: stagesLoading, error: stagesError, addStage, editStage, removeStage, isOnline: stagesOnline } = useStages();

  const isOnline = dealsOnline && stagesOnline;

  const [activeFilters, setActiveFilters] = useState({
    period: null,
    sector: null,
    tag: null,
  });

  const [selectedDeal, setSelectedDeal] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState('stages');
  const [sectors, setSectors] = useState(() => getSectors());
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(
    () => !localStorage.getItem('hi_pipe_welcomed')
  );

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

  const filteredDeals = deals.filter(deal => {
    if (activeFilters.period && deal.period !== activeFilters.period) return false;
    if (activeFilters.sector && deal.sector !== activeFilters.sector) return false;
    if (activeFilters.tag) {
      const tags = deal.tags ? deal.tags.split(',').map(t => t.trim()) : [];
      if (!tags.includes(activeFilters.tag)) return false;
    }
    return true;
  });

  const availableTags = Array.from(
    new Set(
      deals.flatMap(deal =>
        deal.tags ? deal.tags.split(',').map(t => t.trim()) : []
      )
    )
  ).sort();

  const handleFilterChange = (filterType, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const handleDealClick = (deal) => {
    setSelectedDeal(deal);
  };

  const handleDealSave = async (data) => {
    if (selectedDeal) {
      await editDeal(selectedDeal._id, data);
    } else {
      await addDeal(data);
    }
    setSelectedDeal(null);
    setIsAddModalOpen(false);
  };

  const handleDealDelete = async (id) => {
    await removeDeal(id);
    setSelectedDeal(null);
    setIsAddModalOpen(false);
  };

  const dealCounts = stages.reduce((acc, stage) => {
    acc[stage.slug] = deals.filter(d => d.stage === stage.slug).length;
    return acc;
  }, {});

  const openSettings = (tab = 'stages') => {
    setSettingsTab(tab);
    setIsSettingsOpen(true);
  };

  const handleSectorAdd = (name) => {
    const next = [...sectors, name];
    setSectors(next);
    saveSectors(next);
  };

  const handleSectorRename = (i, name) => {
    const next = sectors.map((s, j) => j === i ? name : s);
    setSectors(next);
    saveSectors(next);
  };

  const handleSectorDelete = (i) => {
    const next = sectors.filter((_, j) => j !== i);
    setSectors(next);
    saveSectors(next);
  };

  const handleSectorReset = () => {
    resetSectors();
    setSectors(DEFAULT_SECTORS);
  };

  const handleWelcomeApi = () => {
    localStorage.setItem('hi_pipe_welcomed', '1');
    setIsWelcomeOpen(false);
    openSettings('connection');
  };

  const handleWelcomeOffline = () => {
    localStorage.setItem('hi_pipe_welcomed', '1');
    setIsWelcomeOpen(false);
  };

  const handleStageReorder = async (id, direction) => {
    const currentIndex = stages.findIndex(s => s._id === id);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= stages.length) return;

    const currentStage = stages[currentIndex];
    const targetStage = stages[newIndex];

    await editStage(currentStage._id, { sort_order: newIndex + 1 });
    await editStage(targetStage._id, { sort_order: currentIndex + 1 });
  };

  if (dealsLoading || stagesLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <img src="/icon-192.png" alt="Hi Pipe" className="brand-icon" />
          <h1><span className="brand-hi">Hi</span> Pipe</h1>
        </div>
        <div className="header-actions">
          <span className={`connection-badge ${isOnline ? 'online' : 'offline'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
          <button className="btn-settings" onClick={() => openSettings('stages')} aria-label="Settings">⚙️</button>
        </div>
      </header>

      <FilterBar
        activePeriod={activeFilters.period}
        activeSector={activeFilters.sector}
        activeTag={activeFilters.tag}
        onPeriodChange={(value) => handleFilterChange('period', value)}
        onSectorChange={(value) => handleFilterChange('sector', value)}
        onTagChange={(value) => handleFilterChange('tag', value)}
        availableTags={availableTags}
        sectors={sectors}
      />

      <TotalsBar deals={filteredDeals} />

      <Board
        stages={stages}
        deals={filteredDeals}
        onDealClick={handleDealClick}
        onMoveDeal={moveDeal}
      />

      <button className="btn-add-deal" onClick={() => setIsAddModalOpen(true)}>+ Add Deal</button>

      {(selectedDeal !== null || isAddModalOpen) && (
        <DealModal
          deal={selectedDeal}
          stages={stages}
          sectors={sectors}
          onSave={handleDealSave}
          onDelete={handleDealDelete}
          onClose={() => { setSelectedDeal(null); setIsAddModalOpen(false); }}
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
          isOnline={isOnline}
          connectionError={stagesError}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {isWelcomeOpen && (
        <WelcomeModal
          onUseApi={handleWelcomeApi}
          onUseOffline={handleWelcomeOffline}
        />
      )}
    </div>
  );
}

export default App;
