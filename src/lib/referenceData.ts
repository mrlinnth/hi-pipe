import type { CockpitFinancialQuarter } from '../types';

export function filterCurrentYearQuarters(
  quarters: CockpitFinancialQuarter[],
  year: number = new Date().getFullYear(),
): CockpitFinancialQuarter[] {
  const yearToken = `FY${year}`;

  return quarters
    .filter((quarter) => quarter.name.includes(yearToken))
    .sort((left, right) => left.quarter_number - right.quarter_number);
}
