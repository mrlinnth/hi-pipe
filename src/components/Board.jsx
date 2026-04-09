import { useState } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { Column } from './Column';
import { DealCard } from './DealCard';

export function Board({ stages, deals, onDealClick, onMoveDeal }) {
  const [activeId, setActiveId] = useState(null);

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const deal = deals.find(d => d._id === active.id);
    if (deal && deal.stage !== over.id) {
      onMoveDeal(deal._id, over.id);
    }
  };

  const activeDeal = activeId ? deals.find(d => d._id === activeId) : null;

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="board">
        {stages.map(stage => (
          <Column
            key={stage._id}
            stage={stage}
            deals={deals.filter(d => d.stage === stage.slug)}
            onDealClick={onDealClick}
          />
        ))}
      </div>
      <DragOverlay>
        {activeDeal ? <DealCard deal={activeDeal} onClick={() => {}} isDraggingOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
