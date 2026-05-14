import { describe, expect, it } from 'vitest';
import type { CockpitClient } from '../types';
import { buildClientSelectOptions, filterSelectOptionsByLabel, sortClientsAlphabetically } from './clients';

function createClient(_id: string, name: string): CockpitClient {
  return {
    _id,
    name,
    status: 'Active',
  };
}

describe('sortClientsAlphabetically', () => {
  it('sorts clients by name case-insensitively', () => {
    const clients: CockpitClient[] = [
      createClient('2', 'zeta Group'),
      createClient('1', 'Acme Corp'),
      createClient('3', 'beta Labs'),
    ];

    expect(sortClientsAlphabetically(clients).map((client) => client.name)).toEqual([
      'Acme Corp',
      'beta Labs',
      'zeta Group',
    ]);
  });

  it('does not mutate the original array', () => {
    const clients: CockpitClient[] = [
      createClient('2', 'B'),
      createClient('1', 'A'),
    ];

    sortClientsAlphabetically(clients);

    expect(clients.map((client) => client.name)).toEqual(['B', 'A']);
  });
});

describe('buildClientSelectOptions', () => {
  it('pins No client as the first option', () => {
    const options = buildClientSelectOptions([
      createClient('2', 'Bravo'),
      createClient('1', 'Alpha'),
    ]);

    expect(options.map((option) => option.label)).toEqual([
      'No client',
      'Alpha',
      'Bravo',
    ]);
  });
});

describe('filterSelectOptionsByLabel', () => {
  it('filters options by case-insensitive substring match', () => {
    const options = [
      { value: '', label: 'No client' },
      { value: '1', label: 'Acme Corp' },
      { value: '2', label: 'Beta Labs' },
    ];

    expect(filterSelectOptionsByLabel(options, 'acm').map((option) => option.label)).toEqual(['Acme Corp']);
    expect(filterSelectOptionsByLabel(options, 'LAB').map((option) => option.label)).toEqual(['Beta Labs']);
  });
});
