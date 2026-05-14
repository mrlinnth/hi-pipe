import { afterEach, describe, expect, it, vi } from 'vitest';
import { canEdit } from './auth';
import type { AuthState, Deal } from '../types';

const baseDeal: Deal = {
  _id: 'deal_1',
  name: 'Deal 1',
  value: 1000,
  stage: 'open',
  period: 'Q1 FY2026',
  sector: 'Retail',
  owner: {
    _id: 'owner_1',
    name: 'Owner',
  },
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('canEdit', () => {
  it('allows owners to edit their own deals in team mode', () => {
    vi.stubEnv('VITE_APP_MODE', 'team');

    const authState: AuthState = {
      userId: 'owner_1',
      userName: 'Owner',
      userRole: 'sales',
      msEmail: 'owner@bimgoc.com',
    };

    expect(canEdit(baseDeal, authState)).toBe(true);
  });

  it('allows admin and management users to edit any deal in team mode', () => {
    vi.stubEnv('VITE_APP_MODE', 'team');

    const adminState: AuthState = {
      userId: 'admin_1',
      userName: 'Admin',
      userRole: 'admin',
      msEmail: 'admin@bimgoc.com',
    };
    const managementState: AuthState = {
      userId: 'mgmt_1',
      userName: 'Management',
      userRole: 'management',
      msEmail: 'management@bimgoc.com',
    };

    expect(canEdit(baseDeal, adminState)).toBe(true);
    expect(canEdit(baseDeal, managementState)).toBe(true);
  });

  it('blocks non-owner non-admin users from editing deals in team mode', () => {
    vi.stubEnv('VITE_APP_MODE', 'team');

    const authState: AuthState = {
      userId: 'other_user',
      userName: 'Other',
      userRole: 'sales',
      msEmail: 'other@bimgoc.com',
    };

    expect(canEdit(baseDeal, authState)).toBe(false);
  });
});
