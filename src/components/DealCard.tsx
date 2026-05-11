import type { Deal } from '../types';

type Props = {
  deal: Deal;
  onClick: (deal: Deal) => void;
  showTags?: boolean;
  compactCards?: boolean;
};

export function DealCard({ deal, onClick, showTags = true, compactCards = false }: Props) {
  return (
    <div
      className={`deal-card ${deal._pending ? 'pending' : ''} ${compactCards ? 'compact' : ''}`}
      onClick={() => onClick(deal)}
    >
      <div className="deal-name">{deal.name}</div>
      <div className="deal-value">
        {new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
        }).format(deal.value)}
      </div>
      {!compactCards && (
        <div className="deal-badges">
          <span className="badge badge-period">{deal.period}</span>
          <span className="badge badge-sector">{deal.sector}</span>
          {deal._pending && <span className="badge badge-pending">Pending sync</span>}
          {deal.client?.name && <span className="badge badge-client">{deal.client.name}</span>}
          {deal.owner?.name && <span className="badge badge-owner">{deal.owner.name}</span>}
        </div>
      )}
      {!compactCards && showTags && deal.tags && (
        <div className="deal-tags">
          {deal.tags.split(',').map((tag: string, index: number) => (
            <span key={index} className="tag-chip">
              {tag.trim()}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
