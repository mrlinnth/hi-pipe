export function TotalsBar({ deals, showTags, setShowTags, compactCards, setCompactCards }) {
  const totalValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);
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
