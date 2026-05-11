import { describe, expect, it } from 'vitest';
import { getOverallDealValue } from './amount';
import type { Deal } from '../types';

describe('getOverallDealValue', () => {
  it('excludes pause and lost deals from the overall amount', () => {
    const deals: Deal[] = [
      { _id: '1', name: 'Active deal', value: 1000, stage: 'open', period: '', sector: '' },
      { _id: '2', name: 'Paused deal', value: 2000, stage: 'pause', period: '', sector: '' },
      { _id: '3', name: 'Lost deal', value: 3000, stage: 'lost', period: '', sector: '' },
      { _id: '4', name: 'Other deal', value: 4000, stage: 'won', period: '', sector: '' },
    ];

    expect(getOverallDealValue(deals)).toBe(5000);
  });

  it('treats missing values as zero', () => {
    const deals: Deal[] = [
      { _id: '1', name: 'Empty deal', stage: 'open', period: '', sector: '' } as Deal,
      { _id: '2', name: 'Paused deal', value: 1500, stage: 'pause', period: '', sector: '' },
    ];

    expect(getOverallDealValue(deals)).toBe(0);
  });
});
