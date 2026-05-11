import { Column } from './Column';
import type { Deal, Stage } from '../types';

type Props = {
  stages: Stage[];
  deals: Deal[];
  onDealClick: (deal: Deal) => void;
  showTags: boolean;
  compactCards: boolean;
};

export function Board({ stages, deals, onDealClick, showTags, compactCards }: Props) {
  return (
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
  );
}
