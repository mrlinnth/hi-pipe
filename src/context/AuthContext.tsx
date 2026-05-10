import { createContext, useContext, type ReactNode } from 'react';
import type { AuthResult } from '../lib/auth';
import type { AuthState as StoredAuthState } from '../types';

type AuthContextValue = {
  authState: StoredAuthState | null;
  isLoading: boolean;
  status: 'restoring' | 'unauthenticated' | 'signing_in' | 'authenticated' | 'pending_approval' | 'inactive' | 'error';
  user: { _id: string } | null;
  role: string | null;
  error: string | null;
  errorReason: AuthResult['reason'] | null;
  login: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type Props = {
  children: ReactNode;
  value: AuthContextValue;
};

function AuthProvider({ children, value }: Props) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider.');
  }
  return context;
}

export { AuthContext, AuthProvider, useAuthContext };
export type { AuthContextValue };
