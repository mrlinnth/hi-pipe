import { useDraggable } from '@dnd-kit/core';

export function DealCard({ deal, onClick, isDraggingOverlay = false }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal._id,
    disabled: isDraggingOverlay,
  });

  const style = !isDraggingOverlay && transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={isDraggingOverlay ? undefined : setNodeRef}
      style={style}
      {...(isDraggingOverlay ? {} : listeners)}
      {...(isDraggingOverlay ? {} : attributes)}
      className={`deal-card ${isDragging && !isDraggingOverlay ? 'dragging' : ''} ${isDraggingOverlay ? 'dragging-overlay' : ''}`}
      onClick={() => {
        if (!isDragging) onClick(deal);
      }}
    >
      <div className="deal-name">{deal.name}</div>
      <div className="deal-value">
        {new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
        }).format(deal.value)}
      </div>
      <div className="deal-badges">
        <span className="badge badge-period">{deal.period}</span>
        <span className="badge badge-sector">{deal.sector}</span>
      </div>
      {deal.tags && (
        <div className="deal-tags">
          {deal.tags.split(',').map((tag, index) => (
            <span key={index} className="tag-chip">
              {tag.trim()}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
