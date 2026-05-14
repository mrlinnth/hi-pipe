import type { Dispatch, SetStateAction } from 'react';
import type { Deal } from '../types';
import { getOverallDealValue } from '../lib/amount';

type Props = {
  deals: Deal[];
  showTags: boolean;
  setShowTags: Dispatch<SetStateAction<boolean>>;
  compactCards: boolean;
  setCompactCards: Dispatch<SetStateAction<boolean>>;
  dealNameQuery: string;
  setDealNameQuery: Dispatch<SetStateAction<string>>;
};

export function TotalsBar({
  deals,
  showTags,
  setShowTags,
  compactCards,
  setCompactCards,
  dealNameQuery,
  setDealNameQuery,
}: Props) {
  const totalValue = getOverallDealValue(deals);
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

  return (
    <div className="totals-bar">
      <div className="totals-left">
        <div className="total-count">{deals.length} deals</div>
        <div className="total-value">{formatter.format(totalValue)}</div>
      </div>
      <div className="totals-search">
        <input
          type="search"
          className="totals-search-input"
          value={dealNameQuery}
          onChange={(e) => setDealNameQuery(e.target.value)}
          placeholder="Search deal name..."
          aria-label="Search deals by name"
        />
      </div>
      <div className="totals-controls">
        <label className="toggle-control">
          <input
            type="checkbox"
            checked={showTags}
            onChange={(e) => setShowTags(e.target.checked)}
          />
          <span className="toggle-text">Show Tags</span>
        </label>
        <label className="toggle-control">
          <input
            type="checkbox"
            checked={compactCards}
            onChange={(e) => setCompactCards(e.target.checked)}
          />
          <span className="toggle-text">Compact Cards</span>
        </label>
      </div>
    </div>
  );
}
