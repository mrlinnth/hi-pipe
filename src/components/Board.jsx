import { DndContext } from '@dnd-kit/core';
import { Column } from './Column';

export function Board({ stages, deals, onDealClick, onMoveDeal }) {
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const deal = deals.find(d => d._id === active.id);
    if (deal && deal.stage !== over.id) {
      onMoveDeal(deal._id, over.id);
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
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
    </DndContext>
  );
}
