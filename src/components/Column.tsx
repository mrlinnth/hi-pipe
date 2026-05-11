import { DealCard } from './DealCard';
import type { Deal, Stage } from '../types';

type Props = {
  stage: Stage;
  deals: Deal[];
  onDealClick: (deal: Deal) => void;
  showTags: boolean;
  compactCards: boolean;
};

export function Column({ stage, deals, onDealClick, showTags, compactCards }: Props) {
  const totalValue = deals.reduce((sum: number, deal: Deal) => sum + (deal.value || 0), 0);
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

  return (
    <div className="column">
      <div className="column-header" style={{ backgroundColor: stage.color }}>
        <div className="column-title">{stage.name} <span className="column-count">{deals.length}</span></div>
        <div className="column-stats">
          <span className="column-value">{formatter.format(totalValue)}</span>
        </div>
      </div>
      <div className="column-content">
        {deals.map((deal: Deal) => (
          <DealCard key={deal._id} deal={deal} onClick={onDealClick} showTags={showTags} compactCards={compactCards} />
        ))}
      </div>
    </div>
  );
}
