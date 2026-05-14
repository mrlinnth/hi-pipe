import { describe, expect, it } from 'vitest';
import { normalizeCreatedTeamDeal } from './deals';
import type { Deal } from '../types';

describe('normalizeCreatedTeamDeal', () => {
  it('fills in owner when API create response has no owner', () => {
    const createdDeal = {
      _id: 'deal_1',
      name: 'Deal 1',
      value: 1000,
      stage: 'open',
      period: 'Q1 FY2026',
      sector: 'Retail',
    } as Deal;

    expect(normalizeCreatedTeamDeal(createdDeal, 'user_1', 'Alice')).toEqual({
      ...createdDeal,
      owner: {
        _id: 'user_1',
        name: 'Alice',
      },
    });
  });

  it('preserves owner when API create response already has owner', () => {
    const createdDeal = {
      _id: 'deal_1',
      name: 'Deal 1',
      value: 1000,
      stage: 'open',
      period: 'Q1 FY2026',
      sector: 'Retail',
      owner: { _id: 'user_api', name: 'From API' },
    } as Deal;

    expect(normalizeCreatedTeamDeal(createdDeal, 'user_local', 'Local User')).toEqual(createdDeal);
  });
});
