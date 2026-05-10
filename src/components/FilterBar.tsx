import { useState } from 'react';
type Props = {
  activePeriod: string | null;
  activeSector: string | null;
  activeTag: string | null;
  onPeriodChange: (value: string | null) => void;
  onSectorChange: (value: string | null) => void;
  onTagChange: (value: string | null) => void;
  availableTags: string[];
  sectors: string[];
  periods: string[];
};

export function FilterBar({ activePeriod, activeSector, activeTag, onPeriodChange, onSectorChange, onTagChange, availableTags, sectors, periods }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  const activeChips: Array<{ label: string; clear: () => void }> = [];
  if (activePeriod) activeChips.push({ label: activePeriod, clear: () => onPeriodChange(null) });
  if (activeSector) activeChips.push({ label: activeSector, clear: () => onSectorChange(null) });
  if (activeTag) activeChips.push({ label: activeTag, clear: () => onTagChange(null) });

  const hasActive = activeChips.length > 0;

  return (
    <div className="filter-bar">
      <div className="filter-bar-header">
        <button
          type="button"
          className={`filter-toggle-btn${hasActive ? ' has-active' : ''}`}
          onClick={() => setIsExpanded(v => !v)}
        >
          {isExpanded ? '▲' : '▼'} Filters
        </button>
        {activeChips.map(({ label, clear }) => (
          <button key={label} className="filter-active-chip" type="button" onClick={clear}>
            {label} <span className="filter-active-chip-x">×</span>
          </button>
        ))}
      </div>

      {isExpanded && (
        <div className="filter-rows">
          <div className="filter-group">
            {['All', ...periods].map(period => (
              <button
                key={period}
                type="button"
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
                type="button"
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
                  type="button"
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
