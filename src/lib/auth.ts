import {
  BrowserAuthErrorCodes,
  BrowserCacheLocation,
  PublicClientApplication,
} from '@azure/msal-browser';
import { findOrCreateUser } from './cockpit';
import type { AuthState as StoredAuthState, CockpitUser } from '../types';
import type { Deal } from '../types';

export type AuthResult =
  | { success: true; user: CockpitUser }
  | {
      success: false;
      reason: 'domain_not_allowed' | 'pending_approval' | 'inactive' | 'cancelled' | 'error';
      message?: string;
    };

const AUTH_STORAGE_KEY = 'hi_pipe_auth';
const DEFAULT_ALLOWED_DOMAIN = 'bimgoc.com';
const MSAL_INTERACTION_STATUS_KEY = 'msal.interaction.status';
const MSAL_TEMPORARY_CACHE_KEYS = [
  'request.params',
  'code.verifier',
  'request.origin',
  'urlHash',
  'request.native',
] as const;

let msalInstance: PublicClientApplication | null = null;
let initializePromise: Promise<void> | null = null;
let interactiveLoginInProgress = false;

function getClientId(): string {
  const value = import.meta.env.VITE_ENTRA_CLIENT_ID?.trim();
  if (!value) {
    throw new Error('VITE_ENTRA_CLIENT_ID is not configured.');
  }
  return value;
}

function getTenantId(): string {
  const value = import.meta.env.VITE_ENTRA_TENANT_ID?.trim();
  if (!value) {
    throw new Error('VITE_ENTRA_TENANT_ID is not configured.');
  }
  return value;
}

function getAllowedDomain(): string {
  return import.meta.env.VITE_ALLOWED_DOMAIN?.trim() || DEFAULT_ALLOWED_DOMAIN;
}

function getAuthority(): string {
  return `https://login.microsoftonline.com/${getTenantId()}`;
}

function getMsalInstance(): PublicClientApplication {
  if (!msalInstance) {
    createMsalInstance();
  }

  if (!msalInstance) {
    throw new Error('Microsoft auth is not initialized.');
  }

  return msalInstance;
}

function getStoredAuthState(user: CockpitUser, email: string): StoredAuthState {
  return {
    userId: user._id,
    userName: user.name,
    userRole: user.role,
    msEmail: email,
  };
}

function isStoredAuthState(value: unknown): value is StoredAuthState {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<StoredAuthState>;
  const roles = ['admin', 'management', 'sales', 'solution', 'am'] as const;

  return (
    typeof candidate.userId === 'string'
    && typeof candidate.userName === 'string'
    && typeof candidate.msEmail === 'string'
    && typeof candidate.userRole === 'string'
    && roles.includes(candidate.userRole as (typeof roles)[number])
  );
}

function getClaimValue(claims: unknown, key: 'preferred_username' | 'email' | 'name'): string {
  if (!claims || typeof claims !== 'object') {
    return '';
  }

  const value = (claims as Record<string, unknown>)[key];
  return typeof value === 'string' ? value.trim() : '';
}

function isCancelledError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const code = (error as { errorCode?: string }).errorCode;
  return code === BrowserAuthErrorCodes.userCancelled;
}

function persistSession(session: StoredAuthState): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

function createMsalInstance(): void {
  if (msalInstance) {
    return;
  }

  msalInstance = new PublicClientApplication({
    auth: {
      clientId: getClientId(),
      authority: getAuthority(),
    },
    cache: {
      cacheLocation: BrowserCacheLocation.LocalStorage,
    },
  });
}

function hasActiveRedirectResponse(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const searchParams = new URLSearchParams(window.location.search);
  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
  const hashParams = new URLSearchParams(hash);

  return ['code', 'error', 'state'].some(
    (key) => searchParams.has(key) || hashParams.has(key),
  );
}

function clearStaleMsalInteractionState(clientId: string): void {
  if (typeof window === 'undefined' || hasActiveRedirectResponse()) {
    return;
  }

  sessionStorage.removeItem(MSAL_INTERACTION_STATUS_KEY);
  for (const key of MSAL_TEMPORARY_CACHE_KEYS) {
    sessionStorage.removeItem(`msal.${clientId}.${key}`);
  }
}

function isInteractionInProgressError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const code = (error as { errorCode?: string }).errorCode;
  return code === BrowserAuthErrorCodes.interactionInProgress;
}

function hasMsalInteractionInProgress(): boolean {
  if (interactiveLoginInProgress) {
    return true;
  }

  if (typeof window === 'undefined') {
    return false;
  }

  return Boolean(sessionStorage.getItem(MSAL_INTERACTION_STATUS_KEY));
}

export function initMsal(): Promise<void> {
  createMsalInstance();

  if (initializePromise) {
    return initializePromise;
  }

  const instance = getMsalInstance();
  initializePromise = (async () => {
    try {
      await instance.initialize();
      clearStaleMsalInteractionState(getClientId());
      await instance.handleRedirectPromise();
    } catch (err: unknown) {
      console.error('Failed to initialize Microsoft auth:', err);
      throw err;
    } finally {
      initializePromise = null;
    }
  })();

  return initializePromise;
}

async function ensureMsalReady(): Promise<void> {
  await initMsal();
}

export async function loginWithMicrosoft(): Promise<AuthResult> {
  try {
    await ensureMsalReady();

    if (hasMsalInteractionInProgress()) {
      return {
        success: false,
        reason: 'error',
        message: 'Microsoft sign-in is already in progress. Please wait and try again.',
      };
    }

    const instance = getMsalInstance();

    let result;
    try {
      interactiveLoginInProgress = true;
      result = await instance.loginPopup({ scopes: ['openid', 'profile', 'email'] });
    } catch (err) {
      if (isCancelledError(err)) {
        return {
          success: false,
          reason: 'cancelled',
          message: 'Microsoft sign-in was cancelled.',
        };
      }

      if (isInteractionInProgressError(err)) {
        return {
          success: false,
          reason: 'error',
          message: 'Microsoft sign-in is already in progress. Please wait and try again.',
        };
      }

      return {
        success: false,
        reason: 'error',
        message: err instanceof Error ? err.message : 'Microsoft sign-in failed.',
      };
    } finally {
      interactiveLoginInProgress = false;
    }

    const claims = result.idTokenClaims as unknown;
    const email = getClaimValue(claims, 'preferred_username') || getClaimValue(claims, 'email');
    const name = getClaimValue(claims, 'name') || email.split('@')[0] || 'New User';

    if (!email) {
      return {
        success: false,
        reason: 'error',
        message: 'Could not read an email address from Microsoft.',
      };
    }

    const allowedDomain = getAllowedDomain().toLowerCase();
    const emailDomain = email.split('@')[1]?.toLowerCase() ?? '';
    if (emailDomain !== allowedDomain) {
      return {
        success: false,
        reason: 'domain_not_allowed',
        message: `Please sign in with an @${allowedDomain} account.`,
      };
    }

    const user = await findOrCreateUser(email, name);

    if (user.approval_status === 'pending' || user.approval_status === 'rejected') {
      return {
        success: false,
        reason: 'pending_approval',
        message: user.approval_status === 'rejected'
          ? 'Your account was rejected. Contact your admin.'
          : 'Your account is waiting for approval.',
      };
    }

    if (!user.active) {
      return {
        success: false,
        reason: 'inactive',
        message: 'Your account is inactive. Contact your admin.',
      };
    }

    persistSession(getStoredAuthState(user, email));
    return { success: true, user };
  } catch (err) {
    return {
      success: false,
      reason: 'error',
      message: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

export function restoreSession(): StoredAuthState | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    return isStoredAuthState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function logout(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function canEdit(deal: Deal, authState: StoredAuthState | null = restoreSession()): boolean {
  if (import.meta.env.VITE_APP_MODE !== 'team') {
    return true;
  }

  return authState?.userId === deal.owner?._id;
}
