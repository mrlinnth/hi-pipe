import { useState } from 'react';
import { PERIODS } from '../constants/options';

export function FilterBar({ activePeriod, activeSector, activeTag, onPeriodChange, onSectorChange, onTagChange, availableTags, sectors }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const activeChips = [
    activePeriod && { label: activePeriod, clear: () => onPeriodChange(null) },
    activeSector && { label: activeSector, clear: () => onSectorChange(null) },
    activeTag    && { label: activeTag,    clear: () => onTagChange(null) },
  ].filter(Boolean);

  const hasActive = activeChips.length > 0;

  return (
    <div className="filter-bar">
      <div className="filter-bar-header">
        <button
          className={`filter-toggle-btn${hasActive ? ' has-active' : ''}`}
          onClick={() => setIsExpanded(v => !v)}
        >
          {isExpanded ? '▲' : '▼'} Filters
        </button>
        {activeChips.map(({ label, clear }) => (
          <button key={label} className="filter-active-chip" onClick={clear}>
            {label} <span className="filter-active-chip-x">×</span>
          </button>
        ))}
      </div>

      {isExpanded && (
        <div className="filter-rows">
          <div className="filter-group">
            {['All', ...PERIODS].map(period => (
              <button
                key={period}
                className={`filter-pill ${activePeriod === (period === 'All' ? null : period) ? 'active' : ''}`}
                onClick={() => onPeriodChange(period === 'All' ? null : period)}
              >
                {period}
              </button>
            ))}
          </div>
          <div className="filter-group">
            {['All', ...sectors].map(sector => (
              <button
                key={sector}
                className={`filter-pill ${activeSector === (sector === 'All' ? null : sector) ? 'active' : ''}`}
                onClick={() => onSectorChange(sector === 'All' ? null : sector)}
              >
                {sector}
              </button>
            ))}
          </div>
          {availableTags.length > 0 && (
            <div className="filter-group">
              {['All', ...availableTags].map(tag => (
                <button
                  key={tag}
                  className={`filter-pill ${activeTag === (tag === 'All' ? null : tag) ? 'active' : ''}`}
                  onClick={() => onTagChange(tag === 'All' ? null : tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
