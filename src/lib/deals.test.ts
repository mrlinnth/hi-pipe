import { describe, expect, it } from 'vitest';
import { normalizeCreatedTeamDeal, normalizeUpdatedTeamDeal } from './deals';
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

  it('keeps the existing owner when an update response omits populated relations', () => {
    const previousDeal = {
      _id: 'deal_1',
      name: 'Deal 1',
      value: 1000,
      stage: 'open',
      period: 'Q1 FY2026',
      sector: 'Retail',
      owner: { _id: 'owner_1', name: 'Owner' },
    } as Deal;
    const updatedDeal = {
      ...previousDeal,
      value: 1500,
      stage: 'qualified',
    } as Deal;

    const normalizedDeal = normalizeUpdatedTeamDeal(updatedDeal, previousDeal);

    expect(normalizedDeal).toMatchObject({
      ...previousDeal,
      ...updatedDeal,
      owner: previousDeal.owner,
    });
  });

  it('clears pending state after a synced update', () => {
    const previousDeal = {
      _id: 'deal_1',
      name: 'Deal 1',
      value: 1000,
      stage: 'open',
      period: 'Q1 FY2026',
      sector: 'Retail',
      owner: { _id: 'owner_1', name: 'Owner' },
      _pending: true,
    } as Deal;
    const updatedDeal = {
      ...previousDeal,
      value: 1500,
    } as Deal;

    const normalizedDeal = normalizeUpdatedTeamDeal(updatedDeal, previousDeal, { preservePending: false });
    const { _pending: _ignoredPending, ...expectedDeal } = {
      ...previousDeal,
      ...updatedDeal,
      owner: previousDeal.owner,
    };

    expect(normalizedDeal).toMatchObject(expectedDeal);
    expect(normalizedDeal).not.toHaveProperty('_pending');
  });
});
