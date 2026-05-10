import { useDroppable } from '@dnd-kit/core';
import { DealCard } from './DealCard';

export function Column({ stage, deals, onDealClick, showTags, compactCards }) {
  const { setNodeRef } = useDroppable({ id: stage.slug });
  const totalValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

  return (
    <div ref={setNodeRef} className="column">
      <div className="column-header" style={{ backgroundColor: stage.color }}>
        <div className="column-title">{stage.name} <span className="column-count">{deals.length}</span></div>
        <div className="column-stats">
          <span className="column-value">{formatter.format(totalValue)}</span>
        </div>
      </div>
      <div className="column-content">
        {deals.map(deal => (
          <DealCard key={deal._id} deal={deal} onClick={onDealClick} showTags={showTags} compactCards={compactCards} />
        ))}
      </div>
    </div>
  );
}
