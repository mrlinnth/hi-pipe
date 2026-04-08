import { useState, useEffect } from 'react';
import { useDeals } from './hooks/useDeals';
import { useStages } from './hooks/useStages';
import { PERIODS } from './constants/options';

function App() {
  const { deals, loading: dealsLoading, error: dealsError } = useDeals();
  const { stages, loading: stagesLoading, error: stagesError } = useStages();
  
  const [activeFilters, setActiveFilters] = useState({
    period: null,
    sector: null,
    tag: null,
  });
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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

  if (dealsLoading || stagesLoading) {
    return <div>Loading...</div>;
  }

  if (dealsError || stagesError) {
    return <div>Error: {dealsError || stagesError}</div>;
  }

  return (
    <div className="app">
      <h1>hi-pipe</h1>
      <p>Sales pipeline application</p>
      <pre>{JSON.stringify({ filteredDeals: filteredDeals.length, availableTags }, null, 2)}</pre>
    </div>
  );
}

export default App;
