import { useEffect, useRef, useState } from 'react';

type OwnerOption = {
  value: string;
  label: string;
};

type Props = {
  activePeriod: string | null;
  activeSector: string | null;
  activeTag: string | null;
  activeOwner: string | null;
  onPeriodChange: (value: string | null) => void;
  onSectorChange: (value: string | null) => void;
  onTagChange: (value: string | null) => void;
  onOwnerChange: (value: string | null) => void;
  onExportCsv: () => void;
  onExportExcel: () => void;
  availableTags: string[];
  sectors: string[];
  periods: string[];
  ownerOptions: OwnerOption[];
  showOwnerFilter: boolean;
};

export function FilterBar({
  activePeriod,
  activeSector,
  activeTag,
  activeOwner,
  onPeriodChange,
  onSectorChange,
  onTagChange,
  onOwnerChange,
  onExportCsv,
  onExportExcel,
  availableTags,
  sectors,
  periods,
  ownerOptions,
  showOwnerFilter,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, []);

  const activeChips: Array<{ label: string; clear: () => void }> = [];
  if (activePeriod) activeChips.push({ label: activePeriod, clear: () => onPeriodChange(null) });
  if (activeSector) activeChips.push({ label: activeSector, clear: () => onSectorChange(null) });
  if (activeTag) activeChips.push({ label: activeTag, clear: () => onTagChange(null) });
  if (activeOwner) {
    const activeOwnerLabel = ownerOptions.find((owner) => owner.value === activeOwner)?.label ?? activeOwner;
    activeChips.push({ label: activeOwnerLabel, clear: () => onOwnerChange(null) });
  }

  const hasActive = activeChips.length > 0;

  return (
    <div className="filter-bar">
      <div className="filter-bar-header">
        <div className="filter-bar-left">
          <div className="filter-bar-actions">
            <button
              type="button"
              className={`filter-toggle-btn${hasActive ? ' has-active' : ''}`}
              onClick={() => setIsExpanded(v => !v)}
            >
              {isExpanded ? '▲' : '▼'} Filters
            </button>
          </div>
          {activeChips.length > 0 && (
            <div className="filter-bar-chips">
              {activeChips.map(({ label, clear }, index) => (
                <button key={`${label}-${index}`} className="filter-active-chip" type="button" onClick={clear}>
                  {label} <span className="filter-active-chip-x">×</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="filter-bar-right">
          <div className="export-menu" ref={exportMenuRef}>
            <button
              type="button"
              className="export-menu-btn"
              onClick={() => setIsExportOpen(v => !v)}
              aria-haspopup="menu"
              aria-expanded={isExportOpen}
            >
              Export
            </button>
            {isExportOpen && (
              <div className="export-menu-dropdown" role="menu">
                <button
                  type="button"
                  className="export-menu-item"
                  onClick={() => {
                    onExportCsv();
                    setIsExportOpen(false);
                  }}
                >
                  Export CSV
                </button>
                <button
                  type="button"
                  className="export-menu-item"
                  onClick={() => {
                    onExportExcel();
                    setIsExportOpen(false);
                  }}
                >
                  Export Excel
                </button>
              </div>
            )}
          </div>
        </div>
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
          {showOwnerFilter && (
            <div className="filter-group">
              {[{ value: null, label: 'All' }, ...ownerOptions.map((owner) => ({ value: owner.value, label: owner.label }))].map((owner) => {
                return (
                  <button
                    key={owner.value ?? 'all'}
                    type="button"
                    className={`filter-pill ${activeOwner === owner.value ? 'active' : ''}`}
                    onClick={() => onOwnerChange(owner.value)}
                  >
                    {owner.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
