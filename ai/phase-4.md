"Read ai/CONSTRAINTS.md before starting. Apply all constraints without exception."

You are adding CSV and Excel export of deals to hi-pipe.
Read all instructions before writing any code.

---

CONTEXT

The board shows deals filtered by the current active filters (period,
sector, stage, tags). Export must respect these filters — only export
what is currently visible on the board.

In team mode with employee role, only own deals are shown, so export
will only contain own deals. No special handling needed.

---

PACKAGES TO INSTALL

  npm install xlsx

The xlsx package (SheetJS) handles both CSV and Excel (.xlsx) export.

---

STEP 1 — Create src/lib/export.ts

Export this function:

  exportDeals(deals: Deal[], format: 'csv' | 'xlsx'): void

It must:
  1. Map deals to a flat row structure:
       Name, Value, Stage, Period, Sector, Client, Tags, Notes, Owner
     - Stage: use the stage slug or name
     - Client: use client.name if set, else empty
     - Owner: use owner.name if set, else empty (personal mode has no owner)
     - Value: numeric, no currency symbol
  2. Create a worksheet using SheetJS
  3. For CSV: use XLSX.utils.sheet_to_csv and trigger a file download
  4. For Excel: use XLSX.writeFile to trigger a download
  5. Filename format:
       hi-pipe-deals-{YYYY-MM-DD}.csv
       hi-pipe-deals-{YYYY-MM-DD}.xlsx

---

STEP 2 — Add export button to the UI

Add an export dropdown button to the filter bar area.
It should show two options: "Export CSV" and "Export Excel".

On click, call exportDeals with the currently filtered deals array.

The button must:
  - Match existing plain CSS style
  - Be placed near the filter controls, not on individual cards
  - Show a simple dropdown on click (no library needed, plain CSS + state)
  - Close the dropdown when clicking outside it

---

STEP 3 — Verify

  - Apply some filters on the board
  - Click Export CSV — downloaded file contains only visible deals
  - Click Export Excel — downloaded file opens correctly in Excel
  - All columns present with correct data
  - Filename includes today's date
