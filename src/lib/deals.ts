import type { Deal } from '../types';

export function normalizeCreatedTeamDeal(
  createdDeal: Deal,
  ownerId: string | null,
  ownerName: string,
): Deal {
  if (!ownerId || createdDeal.owner?._id) {
    return createdDeal;
  }

  return {
    ...createdDeal,
    owner: {
      _id: ownerId,
      name: createdDeal.owner?.name ?? ownerName,
    },
  };
}

type NormalizeUpdatedTeamDealOptions = {
  preservePending?: boolean;
  fallbackOwner?: NonNullable<Deal['owner']> | null;
};

export function normalizeUpdatedTeamDeal(
  updatedDeal: Deal,
  previousDeal?: Deal | null,
  options: NormalizeUpdatedTeamDealOptions = {},
): Deal {
  const {
    preservePending = true,
    fallbackOwner = null,
  } = options;

  const normalizedDeal: Deal = {
    ...(previousDeal ?? {}),
    ...updatedDeal,
  };

  const owner = updatedDeal.owner ?? previousDeal?.owner ?? fallbackOwner;
  if (owner) {
    normalizedDeal.owner = owner;
  } else {
    delete normalizedDeal.owner;
  }

  if (!preservePending) {
    delete normalizedDeal._pending;
  }

  return normalizedDeal;
}
