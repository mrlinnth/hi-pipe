import { useState } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { Column } from './Column';
import { DealCard } from './DealCard';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import type { Deal, Stage } from '../types';

type Props = {
  stages: Stage[];
  deals: Deal[];
  onDealClick: (deal: Deal) => void;
  onMoveDeal: (id: string, newStageSlug: string) => void | Promise<void>;
  showTags: boolean;
  compactCards: boolean;
};

export function Board({ stages, deals, onDealClick, onMoveDeal, showTags, compactCards }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const deal = deals.find((d: Deal) => d._id === String(active.id));
    if (deal && deal.stage !== over.id) {
      onMoveDeal(deal._id, String(over.id));
    }
  };

  const activeDeal = activeId ? deals.find((d: Deal) => d._id === activeId) : null;

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="board">
        {stages.map((stage: Stage) => (
          <Column
            key={stage._id}
            stage={stage}
            deals={deals.filter((d: Deal) => d.stage === stage.slug)}
            onDealClick={onDealClick}
            showTags={showTags}
            compactCards={compactCards}
          />
        ))}
      </div>
      <DragOverlay>
        {activeDeal ? <DealCard deal={activeDeal} onClick={() => {}} isDraggingOverlay={true} showTags={showTags} compactCards={compactCards} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
