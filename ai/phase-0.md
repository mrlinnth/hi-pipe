"Read ai/CONSTRAINTS.md before starting. Apply all constraints without exception."

You are migrating the hi-pipe React + Vite project from JavaScript to TypeScript.
This is a mechanical migration only. Do not change any logic, component behaviour,
or file structure beyond what is required for TypeScript to work.

---

STEP 1 — Install dependencies

Run:
  npm install --save-dev typescript @types/react @types/react-dom @types/node

---

STEP 2 — Create tsconfig.json in the project root

Use these settings:
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}

---

STEP 3 — Update vite.config.js → vite.config.ts

Rename the file and ensure it still works as-is. No other changes.

---

STEP 4 — Rename all source files

  src/main.jsx              → src/main.tsx
  src/App.jsx               → src/App.tsx
  src/components/*.jsx      → src/components/*.tsx
  src/hooks/*.js            → src/hooks/*.ts
  src/api/*.js              → src/api/*.ts
  src/constants/*.js        → src/constants/*.ts

---

STEP 5 — Create src/types.ts

Create this file with the following exact content. These types are shared
with the BIM.visitplan project and must not be modified:

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

---

STEP 6 — Fix type errors

After renaming files, run:
  npx tsc --noEmit

Fix all errors that appear. Follow these rules:

- For any value that is genuinely unknown, type it as `unknown` first,
  then narrow it. Avoid `any` unless there is no alternative.
- For Cockpit API responses, use the types from src/types.ts.
- For React component props that have no existing prop types, add a
  simple Props type above each component.
- For event handlers, use the correct React event types:
    onChange → React.ChangeEvent<HTMLInputElement>
    onClick  → React.MouseEvent<HTMLButtonElement>
- Do not change any component logic while fixing type errors.

---

STEP 7 — Update index.html if needed

Make sure the script tag points to src/main.tsx if it was changed.

---

STEP 8 — Verify

Run:
  npm run dev

The app must start and work exactly as before. No visual or behavioural
changes are acceptable. If anything breaks, fix it before finishing.
