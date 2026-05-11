import { describe, expect, it } from 'vitest';
import { filterCurrentYearQuarters } from './referenceData';
import type { CockpitFinancialQuarter } from '../types';

describe('filterCurrentYearQuarters', () => {
  it('keeps only current-year quarters in quarter order', () => {
    const quarters: CockpitFinancialQuarter[] = [
      { _id: '1', name: 'Q3 FY2025', quarter_number: 3, active: true },
      { _id: '2', name: 'Q1 FY2026', quarter_number: 1, active: true },
      { _id: '3', name: 'Q4 FY2026', quarter_number: 4, active: true },
      { _id: '4', name: 'Q2 FY2026', quarter_number: 2, active: true },
      { _id: '5', name: 'Q1 FY2025', quarter_number: 1, active: true },
    ];

    expect(filterCurrentYearQuarters(quarters, 2026).map((quarter) => quarter.name)).toEqual([
      'Q1 FY2026',
      'Q2 FY2026',
      'Q4 FY2026',
    ]);
  });
});
