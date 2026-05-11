import type { AuthResult } from '../lib/auth';
import { getAppName } from '../lib/appName';

type Props = {
  isLoading: boolean;
  error: string | null;
  errorReason: AuthResult['reason'] | null;
  onLogin: () => Promise<void>;
};

function getErrorMessage(reason: AuthResult['reason'] | null, message: string | null): string {
  if (message) {
    return message;
  }

  switch (reason) {
    case 'domain_not_allowed':
      return 'Please sign in with your company account.';
    case 'pending_approval':
      return 'Your account is waiting for approval.';
    case 'inactive':
      return 'Your account is inactive. Contact your admin.';
    case 'cancelled':
      return 'Sign-in was cancelled.';
    case 'error':
    default:
      return 'Microsoft sign-in failed.';
  }
}

export function LoginScreen({ isLoading, error, errorReason, onLogin }: Props) {
  const busy = isLoading;
  const buttonLabel = busy ? 'Signing in...' : 'Sign in with Microsoft';
  const appName = getAppName();

  return (
    <main className="login-screen">
      <div className="login-screen-card">
        <div className="brand login-brand">
          <img src="/icon-192.png" alt={appName} className="brand-icon" />
          <div>
            <p className="login-kicker">Team access</p>
            <h1>{appName}</h1>
          </div>
        </div>

        <p className="login-copy">
          Sign in with your company Microsoft account to access the team pipeline.
        </p>

        <button
          className={`btn-save login-button ${busy ? 'btn-loading' : ''}`}
          type="button"
          onClick={() => {
            void onLogin();
          }}
          disabled={busy}
        >
          {!busy && (
            <svg
              aria-hidden="true"
              focusable="false"
              width="20"
              height="20"
              viewBox="0 0 20 20"
            >
              <rect x="1" y="1" width="8" height="8" fill="#F25022" />
              <rect x="10" y="1" width="8" height="8" fill="#7FBA00" />
              <rect x="1" y="10" width="8" height="8" fill="#00A4EF" />
              <rect x="10" y="10" width="8" height="8" fill="#FFB900" />
            </svg>
          )}
          {buttonLabel}
        </button>

        <p className="login-note">
          Only <strong>@bimgoc.com</strong> accounts are allowed.
        </p>

        {(error || errorReason) && (
          <div className="login-error" role="alert">
            {getErrorMessage(errorReason, error)}
          </div>
        )}
      </div>
    </main>
  );
}
