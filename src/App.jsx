import { useState, useEffect } from 'react';
import { useDeals } from './hooks/useDeals';
import { useStages } from './hooks/useStages';
import { FilterBar } from './components/FilterBar';
import { TotalsBar } from './components/TotalsBar';
import { Board } from './components/Board';
import { DealModal } from './components/DealModal';
import { StageSettings } from './components/StageSettings';
import { ConnectionSettings } from './components/ConnectionSettings';
import { WelcomeModal } from './components/WelcomeModal';

function App() {
  const { deals, loading: dealsLoading, error: dealsError, reload: reloadDeals, addDeal, editDeal, removeDeal, moveDeal, isOnline: dealsOnline } = useDeals();
  const { stages, loading: stagesLoading, error: stagesError, reload: reloadStages, addStage, editStage, removeStage, isOnline: stagesOnline } = useStages();

  const isOnline = dealsOnline && stagesOnline;

  const [activeFilters, setActiveFilters] = useState({
    period: null,
    sector: null,
    tag: null,
  });

  const [selectedDeal, setSelectedDeal] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isConnectionOpen, setIsConnectionOpen] = useState(false);
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

  const handleWelcomeApi = () => {
    localStorage.setItem('hi_pipe_welcomed', '1');
    setIsWelcomeOpen(false);
    setIsConnectionOpen(true);
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
          <button className="btn-settings" onClick={() => setIsConnectionOpen(true)}>API</button>
          <button className="btn-settings" onClick={() => setIsSettingsOpen(true)}>⚙️ Stages</button>
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
          onSave={handleDealSave}
          onDelete={handleDealDelete}
          onClose={() => { setSelectedDeal(null); setIsAddModalOpen(false); }}
        />
      )}

      {isSettingsOpen && (
        <StageSettings
          stages={stages}
          onAdd={addStage}
          onEdit={editStage}
          onDelete={removeStage}
          onReorder={handleStageReorder}
          onClose={() => setIsSettingsOpen(false)}
          dealCounts={dealCounts}
        />
      )}

      {isConnectionOpen && (
        <ConnectionSettings
          isOnline={isOnline}
          onClose={() => setIsConnectionOpen(false)}
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
