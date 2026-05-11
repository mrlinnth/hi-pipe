import type { Deal } from '../types';

const EXCLUDED_TOTAL_STAGE_SLUGS = new Set(['pause', 'lost']);

export function getOverallDealValue(deals: Deal[]): number {
  return deals.reduce((sum: number, deal: Deal) => {
    if (EXCLUDED_TOTAL_STAGE_SLUGS.has(deal.stage)) {
      return sum;
    }

    return sum + (deal.value || 0);
  }, 0);
}
