import { PERIODS } from '../constants/options';

export function FilterBar({ activePeriod, activeSector, activeTag, onPeriodChange, onSectorChange, onTagChange, availableTags }) {
  const SECTORS = [
    'Banking',
    'Insurance / Healthcare',
    'Microfinance / Edu / Hotel',
    'Manufacture / Retail',
    'Telecom / Infra / Media',
  ];

  return (
    <div className="filter-bar">
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
        {['All', ...SECTORS].map(sector => (
          <button
            key={sector}
            className={`filter-pill ${activeSector === (sector === 'All' ? null : sector) ? 'active' : ''}`}
            onClick={() => onSectorChange(sector === 'All' ? null : sector)}
          >
            {sector}
          </button>
        ))}
      </div>
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
    </div>
  );
}
