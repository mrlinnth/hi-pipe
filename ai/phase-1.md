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

REFERENCE

The BIM.visitplan project uses the same Cockpit backend and the same MS
login pattern. Use the following as a reference for the OAuth flow:

auth.ts pattern (adapted for web SPA, not React Native):
  - OAuth flow: Authorization Code + PKCE (public client, no secret)
  - Get email from id_token claims (preferred_username or email field)
  - Decode id_token by splitting on '.' and base64-decoding the middle part
  - After getting email, call Cockpit to find or create user record
  - Store userId, userName, userRole, msEmail in localStorage

The Cockpit users collection endpoint is:
  GET  {API_URL}/content/items/users?filter[ms_email]={email}
  POST {API_URL}/content/item/users   (to create new user)

CockpitUser type is already in src/types.ts.
AuthState type is already in src/types.ts.

---

ENVIRONMENT VARIABLES

Add these to .env.example (do not put real values):
  VITE_APP_MODE=personal
  VITE_ENTRA_CLIENT_ID=
  VITE_ENTRA_TENANT_ID=
  VITE_ALLOWED_DOMAIN=bimgoc.com

In team mode, API credentials also come from .env:
  VITE_COCKPIT_API_URL=
  VITE_COCKPIT_API_KEY=

---

PACKAGES TO INSTALL

  npm install @azure/msal-browser

Do not use expo-auth-session — that is for React Native.
Use @azure/msal-browser for the web PKCE flow.

---

STEP 1 — Create src/lib/auth.ts

This file handles all MS auth logic. It must export:

1. initMsal(): void
   Initialises the MSAL PublicClientApplication using VITE_ENTRA_CLIENT_ID
   and VITE_ENTRA_TENANT_ID. Call once on app startup in team mode only.

2. loginWithMicrosoft(): Promise<AuthResult>
   Triggers the MSAL loginPopup flow with scopes ['openid', 'profile', 'email'].
   On success:
     a. Extract email from the id token claims (preferred_username or email)
     b. Validate email domain is @bimgoc.com — if not, return error result
     c. Call findOrCreateUser(email, name) from src/lib/cockpit.ts
     d. Check approval_status — if pending or rejected, return appropriate error
     e. Check active field — if false, return error
     f. Store AuthState in localStorage under key 'hi_pipe_auth'
     g. Return success result with user

3. restoreSession(): AuthState | null
   Read 'hi_pipe_auth' from localStorage and return it, or null if not found.

4. logout(): void
   Clear 'hi_pipe_auth' from localStorage.

AuthResult type (define in this file):
  | { success: true; user: CockpitUser }
  | { success: false; reason: 'domain_not_allowed' | 'pending_approval' |
      'inactive' | 'cancelled' | 'error'; message?: string }

---

STEP 2 — Create src/lib/cockpit.ts

This file contains Cockpit API functions needed for auth.
Later phases will add more functions here.

Export these functions:

1. getUserByMsEmail(email: string): Promise<CockpitUser | null>
   GET {API_URL}/content/items/users
   Filter: { ms_email: email }
   Return first result or null.

2. createUser(email: string, name: string): Promise<CockpitUser>
   POST {API_URL}/content/item/users
   Body: {
     email,
     ms_email: email,
     name,
     role: 'am',
     approval_status: 'pending',
     active: false
   }
   Return created user.

3. findOrCreateUser(email: string, name: string): Promise<CockpitUser>
   Call getUserByMsEmail first.
   If not found, call createUser.
   Return the user either way.

All functions must use the API_URL and API_KEY from:
  - VITE_COCKPIT_API_URL and VITE_COCKPIT_API_KEY env vars in team mode
  - localStorage values in personal mode (existing behaviour)

To handle both modes, read a helper that returns the current connection
config — check localStorage first, fall back to env vars.

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
