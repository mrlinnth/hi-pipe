// ─── Domain enums ─────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'management' | 'sales' | 'solution' | 'am';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type ClientStatus = 'Active' | 'Hold' | 'Inactive' | 'Churned' | 'Prospect';
export type AccountType = 'Named Account' | 'Key Account';

// ─── Cockpit entities ─────────────────────────────────────────────────────

export type CockpitUser = {
  _id: string;
  name: string;
  email: string;
  ms_email?: string | null;
  ms_id?: string | null;
  role: UserRole;
  approval_status: ApprovalStatus;
  active: boolean;
};

export type CockpitClient = {
  _id: string;
  name: string;
  sector?: string | null;
  account_type?: AccountType | null;
  status: ClientStatus;
  am?: Pick<CockpitUser, '_id' | 'name'> | null;
};

export type CockpitSector = {
  _id: string;
  name: string;
  active: boolean;
};

export type CockpitFinancialQuarter = {
  _id: string;
  name: string;
  quarter_number: 1 | 2 | 3 | 4;
  active: boolean;
};

export type Stage = {
  _id: string;
  name: string;
  slug: string;
  color: string;
  sort_order: number;
};

export type Deal = {
  _id: string;
  name: string;
  value: number;
  stage: string;
  period: string;
  sector: string;
  notes?: string;
  tags?: string;
  sort_order?: number | null;
  owner?: Pick<CockpitUser, '_id' | 'name'> | null;
  client?: Pick<CockpitClient, '_id' | 'name'> | null;
  _modified?: number;
  _created?: number;
};

// ─── Local auth session ───────────────────────────────────────────────────

export type AuthState = {
  userId: string;
  userName: string;
  userRole: UserRole;
  msEmail: string;
};
