import { useCallback, useEffect, useReducer, useState } from 'react';
import { initMsal, loginWithMicrosoft, logout as authLogout, restoreSession } from '../lib/auth';
import type { AuthResult } from '../lib/auth';
import type { AuthState as StoredAuthState, CockpitUser } from '../types';

const isTeamMode = import.meta.env.VITE_APP_MODE === 'team';

type AuthStatus =
  | 'restoring'
  | 'unauthenticated'
  | 'signing_in'
  | 'authenticated'
  | 'pending_approval'
  | 'inactive'
  | 'error';

type AuthState = {
  status: AuthStatus;
  user: CockpitUser | null;
  error: string | null;
};

type AuthAction =
  | { type: 'RESTORE_START' }
  | { type: 'RESTORE_SUCCESS'; user: CockpitUser }
  | { type: 'RESTORE_EMPTY' }
  | { type: 'SIGN_IN_START' }
  | { type: 'SIGN_IN_SUCCESS'; user: CockpitUser }
  | { type: 'SIGN_IN_FAIL'; reason: 'pending_approval' | 'inactive' | 'cancelled' | 'error'; message?: string }
  | { type: 'LOGOUT' };

const initialState: AuthState = { status: 'restoring', user: null, error: null };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'RESTORE_START':
      return { status: 'restoring', user: null, error: null };
    case 'RESTORE_SUCCESS':
      return { status: 'authenticated', user: action.user, error: null };
    case 'RESTORE_EMPTY':
      return { status: 'unauthenticated', user: null, error: null };
    case 'SIGN_IN_START':
      return { ...state, status: 'signing_in', error: null };
    case 'SIGN_IN_SUCCESS':
      return { status: 'authenticated', user: action.user, error: null };
    case 'SIGN_IN_FAIL':
      return {
        status: action.reason === 'pending_approval'
          ? 'pending_approval'
          : action.reason === 'inactive'
            ? 'inactive'
            : action.reason === 'cancelled'
              ? 'unauthenticated'
              : 'error',
        user: null,
        error: action.message ?? null,
      };
    case 'LOGOUT':
      return { status: 'unauthenticated', user: null, error: null };
    default:
      return state;
  }
}

type UseAuthResult = {
  authState: StoredAuthState | null;
  isLoading: boolean;
  status: AuthStatus;
  user: CockpitUser | null;
  role: CockpitUser['role'] | null;
  error: string | null;
  errorReason: AuthResult['reason'] | null;
  login: () => Promise<void>;
  logout: () => void;
};

const noopAuthResult: UseAuthResult = {
  authState: null,
  isLoading: false,
  status: 'unauthenticated',
  user: null,
  role: null,
  error: null,
  errorReason: null,
  login: async () => {},
  logout: () => {},
};

function toStoredAuthState(user: CockpitUser): StoredAuthState {
  return {
    userId: user._id,
    userName: user.name,
    userRole: user.role,
    msEmail: user.ms_email ?? user.email,
  };
}

export function useAuth(): UseAuthResult {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [errorReason, setErrorReason] = useState<AuthResult['reason'] | null>(null);

  useEffect(() => {
    if (!isTeamMode) {
      return;
    }

    initMsal();
    dispatch({ type: 'RESTORE_START' });
    const session = restoreSession();
    if (session) {
      dispatch({
        type: 'RESTORE_SUCCESS',
        user: {
          _id: session.userId,
          name: session.userName,
          email: session.msEmail,
          ms_email: session.msEmail,
          role: session.userRole,
          approval_status: 'approved',
          active: true,
        },
      });
    } else {
      dispatch({ type: 'RESTORE_EMPTY' });
    }
  }, []);

  const login = useCallback(async () => {
    if (!isTeamMode) {
      return;
    }

    dispatch({ type: 'SIGN_IN_START' });
    setErrorReason(null);

    try {
      const result = await loginWithMicrosoft();
      if (result.success) {
        dispatch({ type: 'SIGN_IN_SUCCESS', user: result.user });
        setErrorReason(null);
      } else {
        setErrorReason(result.reason);
        dispatch({
          type: 'SIGN_IN_FAIL',
          reason: result.reason,
          message: result.message,
        });
      }
    } catch (err) {
      setErrorReason('error');
      dispatch({
        type: 'SIGN_IN_FAIL',
        reason: 'error',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }, []);

  const logout = useCallback(() => {
    if (!isTeamMode) {
      return;
    }

    authLogout();
    setErrorReason(null);
    dispatch({ type: 'LOGOUT' });
  }, []);

  if (!isTeamMode) {
    return noopAuthResult;
  }

  const authState = state.user ? toStoredAuthState(state.user) : null;

  return {
    authState,
    isLoading: state.status === 'restoring' || state.status === 'signing_in',
    status: state.status,
    user: state.user,
    role: state.user?.role ?? null,
    error: state.error,
    errorReason,
    login,
    logout,
  };
}
