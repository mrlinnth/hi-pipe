import { useDraggable } from '@dnd-kit/core';
import { useAuthContext } from '../context/AuthContext';
import { canEdit } from '../lib/auth';
import type { Deal } from '../types';

type Props = {
  deal: Deal;
  onClick: (deal: Deal) => void;
  isDraggingOverlay?: boolean;
  showTags?: boolean;
  compactCards?: boolean;
};

export function DealCard({ deal, onClick, isDraggingOverlay = false, showTags = true, compactCards = false }: Props) {
  const { authState } = useAuthContext();
  const editable = canEdit(deal, authState);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal._id,
    disabled: isDraggingOverlay || !editable,
  });

  const style = !isDraggingOverlay && transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={isDraggingOverlay ? undefined : setNodeRef}
      style={style}
      {...(isDraggingOverlay ? {} : attributes)}
      className={`deal-card ${deal._pending ? 'pending' : ''} ${isDragging && !isDraggingOverlay ? 'dragging' : ''} ${isDraggingOverlay ? 'dragging-overlay' : ''} ${compactCards ? 'compact' : ''}`}
      onClick={() => {
        if (!isDragging) onClick(deal);
      }}
    >
      {!isDraggingOverlay && (
        <div
          className={`drag-handle${editable ? '' : ' drag-handle-disabled'}`}
          {...(editable ? listeners : {})}
          aria-label={editable ? 'Drag to move' : 'Deal cannot be moved'}
          aria-disabled={!editable}
        >
          ⠿
        </div>
      )}
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
