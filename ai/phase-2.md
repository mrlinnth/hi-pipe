"Read ai/CONSTRAINTS.md before starting. Apply all constraints without exception."

You are enhancing hi-pipe deals with owner and client fields, replacing
hardcoded constants with live Cockpit data, and adding role-based access
control. Read all instructions before writing any code.

---

CONTEXT

The Cockpit backend has these collections relevant to this phase:
  deals            — already used, needs new fields
  users            — already used for auth
  clients          — new, for deal client field
  sectors          — replaces hardcoded SECTORS constant
  financialquarters — replaces hardcoded PERIODS constant (Q1, Q2 etc.)

All types are in src/types.ts:
  Deal, CockpitUser, CockpitClient, CockpitSector, CockpitFinancialQuarter

Auth state is available via useAuthContext() from src/context/AuthContext.tsx.

---

COCKPIT API REFERENCE

GET {API_URL}/content/items/deals
GET {API_URL}/content/items/deals?filter[owner._id]={userId}
GET {API_URL}/content/items/clients?sort[name]=1
GET {API_URL}/content/items/sectors?filter[active]=true&sort[name]=1
GET {API_URL}/content/items/financialquarters?filter[active]=true&sort[quarter_number]=1
POST {API_URL}/content/item/deals
PUT  {API_URL}/content/item/deals/{id}
DELETE {API_URL}/content/item/deals/{id}

When creating or updating a deal, the owner field must be sent as:
  { owner: { _id: authState.userId, _model: 'users' } }

When creating or updating a deal, the client field must be sent as:
  { client: { _id: selectedClientId, _model: 'clients' } }

---

STEP 1 — Update src/types.ts

Update the Deal type to include the new fields:

  owner?: Pick<CockpitUser, '_id' | 'name'> | null;
  client?: Pick<CockpitClient, '_id' | 'name'> | null;

The period field stays as a plain string (e.g. "Q1 FY2026") — it is not
a linked field. It is populated from financialquarters.name.

---

STEP 2 — Update src/lib/cockpit.ts

Add these functions:

1. fetchClients(): Promise<CockpitClient[]>
   GET {API_URL}/content/items/clients?sort[name]=1
   Return all clients sorted by name.

2. fetchSectors(): Promise<CockpitSector[]>
   GET {API_URL}/content/items/sectors?filter[active]=true&sort[name]=1

3. fetchFinancialQuarters(): Promise<CockpitFinancialQuarter[]>
   GET {API_URL}/content/items/financialquarters?filter[active]=true

4. fetchDeals(userId?: string): Promise<Deal[]>
   If userId is provided, filter by owner:
     GET {API_URL}/content/items/deals?filter[owner._id]={userId}
   Otherwise fetch all:
     GET {API_URL}/content/items/deals

5. createDeal(data: Partial<Deal>, ownerId: string): Promise<Deal>
   POST {API_URL}/content/item/deals
   Always inject owner: { _id: ownerId, _model: 'users' }

6. updateDeal(id: string, data: Partial<Deal>): Promise<Deal>
   PUT {API_URL}/content/item/deals/{id}

7. deleteDeal(id: string): Promise<void>
   DELETE {API_URL}/content/item/deals/{id}

---

STEP 3 — Update data fetching hooks

Update src/hooks/useDeals.ts:
  - Accept an optional userId parameter
  - If team mode and user role is am/sales/solution, pass userId to fetchDeals
  - If team mode and user role is management/admin, fetch all deals
  - If personal mode, fetch all deals (existing behaviour)

Create src/hooks/useReferenceData.ts:
  - Fetch clients, sectors, financialquarters in parallel using Promise.all
  - Cache results in localStorage with a timestamp key 'hi_pipe_ref_cache'
  - On load, check if cache is less than 24 hours old — if so use cache
  - If cache is stale or missing, fetch from Cockpit and update cache
  - Expose: { clients, sectors, quarters, isLoading, refresh }

---

STEP 4 — Update deal form component

In the deal form (DealModal or equivalent):

Replace hardcoded sector options with sectors from useReferenceData.
Replace hardcoded period options with quarters.name values from useReferenceData.

Add a client field:
  - Dropdown/select populated from clients list (name field)
  - Stores the selected client _id
  - Optional field — not all deals require a client
  - Show client name in the deal card if set

Add owner display:
  - In team mode, owner is always set automatically to the current user
  - Do not show an owner selector — employees cannot assign to others
  - Management can see the owner name on deal cards they do not own
    but cannot change it

---

STEP 5 — Role-based access control

Add a canEdit(deal: Deal) helper in src/lib/auth.ts:
  - In personal mode, always return true
  - In team mode:
      return authState.userId === deal.owner?._id
  - This means management can see all deals but only edit their own

Apply canEdit in the deal card component:
  - If canEdit returns false, hide edit and delete buttons
  - The drag-and-drop handle should also be disabled for non-editable deals

Apply canEdit in the deal modal:
  - If opened for a deal the user cannot edit, show read-only view
  - All fields disabled, no save button, just a close button

---

STEP 6 — Update deal creation

When creating a new deal in team mode:
  - Automatically set owner to { _id: authState.userId, _model: 'users' }
  - Do not show an owner field in the form

---

STEP 7 — Verify

In personal mode:
  - All existing deal functionality works unchanged
  - Sector and period dropdowns now pull from Cockpit (or cache)
  - Client field appears in deal form

In team mode (role: am/sales/solution):
  - Only own deals are shown on the board
  - New deals are auto-assigned to current user
  - Edit/delete only available on own deals

In team mode (role: management/admin):
  - All deals visible on the board
  - Edit/delete only available on own deals
  - Other users' deals visible but read-only
