export function TotalsBar({ deals }) {
  const totalValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

  return (
    <div className="totals-bar">
      <div className="total-count">{deals.length} deals</div>
      <div className="total-value">{formatter.format(totalValue)}</div>
    </div>
  );
}
