"Read ai/CONSTRAINTS.md before starting. Apply all constraints without exception."

You are adding Microsoft Entra ID (Azure AD) authentication to hi-pipe.
This is a team-mode-only feature controlled by an environment variable.
Read all instructions carefully before writing any code.

The project has just been migrated to TypeScript. All files are .ts / .tsx.
All types are in src/types.ts.

---

CONTEXT

hi-pipe has two modes controlled by VITE_APP_MODE in the .env file:
  VITE_APP_MODE=personal   — current behaviour, no auth
  VITE_APP_MODE=team       — new behaviour, MS login required

In team mode:
  - API URL and token come from .env, never entered by the user
  - MS login is the entry point, replacing the welcome/onboarding screen
  - After login, the app finds or creates the user in the Cockpit `users`
    collection and stores their id, name, role, and email in localStorage
  - Only @bimgoc.com email addresses are allowed

In personal mode:
  - Everything works exactly as before
  - No auth, no MS login, user enters API credentials manually

---

REFERENCE — useAuth.ts from BIM.visitplan

The BIM.visitplan project has a useAuth.ts hook. Copy the following from it
exactly, as-is:
  - AuthStatus type
  - AuthState type (the reducer state, not the localStorage type)
  - AuthAction type
  - authReducer function
  - initialState constant

Do NOT copy anything that imports from expo-auth-session, expo-web-browser,
or react-native. Those are React Native only and will not work in a browser.

The auth mechanics (login trigger, code exchange, session restore) must be
rewritten for the web using @azure/msal-browser as described below.

---

PACKAGES TO INSTALL

  npm install @azure/msal-browser@^4

Do not use expo-auth-session — that is for React Native.
Use @azure/msal-browser for the web PKCE flow. MSAL handles the
authorization code exchange internally — there is no manual code
exchange step like handleAuthCode in the React Native version.

---

STEP 1 — Create src/lib/auth.ts

This file handles all MS auth logic. It must export:

1. initMsal(): void
   Initialises the MSAL PublicClientApplication using VITE_ENTRA_CLIENT_ID
   and VITE_ENTRA_TENANT_ID. Call once on app startup in team mode only.
   Store the instance in module scope so it can be reused.

2. loginWithMicrosoft(): Promise<AuthResult>
   Calls msalInstance.loginPopup({ scopes: ['openid', 'profile', 'email'] }).
   On success:
     a. Extract email from result.idTokenClaims.preferred_username or .email
     b. Extract name from result.idTokenClaims.name
     c. Validate email domain is @bimgoc.com — if not, return domain_not_allowed
     d. Call findOrCreateUser(email, name) from src/lib/cockpit.ts
     e. Check approval_status — pending or rejected returns pending_approval error
     f. Check active field — false returns inactive error
     g. Store AuthState in localStorage under key 'hi_pipe_auth'
     h. Return success result with user
   Note: MSAL handles PKCE and token exchange internally. You do not need
   to exchange an authorization code manually.

3. restoreSession(): AuthState | null
   Read 'hi_pipe_auth' from localStorage and parse it.
   Return the AuthState or null if not found or invalid.

4. logout(): void
   Clear 'hi_pipe_auth' from localStorage.

AuthResult type (define in this file):
  | { success: true; user: CockpitUser }
  | { success: false; reason: 'domain_not_allowed' | 'pending_approval' |
      'inactive' | 'cancelled' | 'error'; message?: string }

---

STEP 2 — Create src/hooks/useAuth.ts

Copy the reducer pattern from BIM.visitplan useAuth.ts:
  - AuthStatus, AuthState, AuthAction types (the reducer ones)
  - authReducer function
  - initialState constant

Then implement the hook using the web MSAL flow:

  export function useAuth() {
    const [state, dispatch] = useReducer(authReducer, initialState);

    // Restore session on mount
    useEffect(() => {
      dispatch({ type: 'RESTORE_START' });
      const session = restoreSession();
      if (session) {
        dispatch({ type: 'RESTORE_SUCCESS', user: session });
      } else {
        dispatch({ type: 'RESTORE_EMPTY' });
      }
    }, []);

    // Login — calls MSAL loginPopup
    const login = useCallback(async () => {
      dispatch({ type: 'SIGN_IN_START' });
      try {
        const result = await loginWithMicrosoft();
        if (result.success) {
          dispatch({ type: 'SIGN_IN_SUCCESS', user: result.user });
        } else {
          dispatch({ type: 'SIGN_IN_FAIL', reason: result.reason, message: result.message });
        }
      } catch (err) {
        dispatch({
          type: 'SIGN_IN_FAIL',
          reason: 'error',
          message: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }, []);

    // Logout
    const logout = useCallback(() => {
      authLogout();
      dispatch({ type: 'LOGOUT' });
    }, []);

    return { status: state.status, user: state.user, role: state.user?.role ?? null,
             error: state.error, login, logout };
  }

Note: No loginReady flag is needed — MSAL loginPopup is always ready,
unlike the Expo useAuthRequest which needs time to prepare.

---

STEP 3 — Create src/hooks/useAuth.ts

This hook manages auth state for team mode.

It must:
  - On mount, call restoreSession() and set state
  - Expose: { authState, isLoading, login, logout }
  - login() calls loginWithMicrosoft() and updates state on success
  - logout() calls logout() from auth.ts and clears state
  - If not in team mode (VITE_APP_MODE !== 'team'), return a no-op result
    so the rest of the app does not need to check the mode flag everywhere

---

STEP 4 — Create src/components/LoginScreen.tsx

This is the MS login entry screen shown in team mode before auth.

Requirements:
  - Match existing plain CSS style — no new CSS frameworks
  - Show the hi-pipe logo/name
  - Show a single "Sign in with Microsoft" button
  - Show a loading state while login is in progress
  - Show an error message if login fails (use the reason and message
    from AuthResult to show a human-readable explanation)
  - Do not show API connection fields — those are irrelevant in team mode

---

STEP 5 — Update src/App.tsx

Add mode-aware routing logic at the top level:

  const isTeamMode = import.meta.env.VITE_APP_MODE === 'team'

  If isTeamMode:
    - Call useAuth()
    - If authState is null, render <LoginScreen />
    - If authState is set, render the existing app

  If not isTeamMode:
    - Render the existing app unchanged

Pass authState down as a prop or store in context — whatever fits the
existing pattern. Do not restructure the component tree beyond what
is necessary.

---

STEP 6 — Create src/context/AuthContext.tsx

Since authState is needed in multiple places (deal creation needs
userId, role checks need userRole), expose it via React context.

Export:
  AuthContext
  AuthProvider (wraps children, provides authState)
  useAuthContext() hook — throws if used outside provider

Wrap the app in AuthProvider inside App.tsx.

---

STEP 7 — Verify

Run npm run dev with VITE_APP_MODE=personal — app must work exactly
as before with no visible changes.

Then set VITE_APP_MODE=team and verify:
  - LoginScreen appears on first load
  - Clicking sign in triggers MS popup
  - After successful login with a @bimgoc.com account, app loads
  - After login, refreshing the page restores the session without
    showing the login screen again
  - Logging out clears session and shows login screen again
