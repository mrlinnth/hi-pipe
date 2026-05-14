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
