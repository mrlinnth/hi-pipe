import type { CockpitClient } from '../types';

export type SelectOption = {
  value: string;
  label: string;
};

export function sortClientsAlphabetically(clients: CockpitClient[]): CockpitClient[] {
  return [...clients].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}

export function buildClientSelectOptions(clients: CockpitClient[]): SelectOption[] {
  return [
    { value: '', label: 'No client' },
    ...sortClientsAlphabetically(clients).map((client) => ({
      value: client._id,
      label: client.name,
    })),
  ];
}

export function filterSelectOptionsByLabel(options: SelectOption[], query: string): SelectOption[] {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) {
    return options;
  }

  return options.filter((option) => option.label.toLocaleLowerCase().includes(normalized));
}
