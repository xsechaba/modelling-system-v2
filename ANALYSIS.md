# DimWiz Platform — Issue Analysis & Implementation Plan

> Date: 14 May 2026  
> Status: Analysis only — no changes implemented yet

---

## Table of Contents

1. [Testing Database Connections](#1-testing-database-connections)
2. [Green Dot Completion Indicator Timing](#2-green-dot-completion-indicator-timing)
3. [Key Callouts Not Appearing After Profiling](#3-key-callouts-not-appearing-after-profiling)
4. [Left Sidebar Icons — Making Them Functional](#4-left-sidebar-icons--making-them-functional)
5. [Requirements Hierarchy Letters (P D K R)](#5-requirements-hierarchy-letters-p-d-k-r)
6. [Adding Processes & Formulas Without the Agent](#6-adding-processes--formulas-without-the-agent)
7. [Requirements Agent Intelligence — KPI & Formula Quality](#7-requirements-agent-intelligence--kpi--formula-quality)
8. [Coherence Across Requirements → Bus Matrix → Schema](#8-coherence-across-requirements--bus-matrix--schema)
9. [Regeneration When Upstream Stages Change](#9-regeneration-when-upstream-stages-change)
10. [Bus Matrix Table Gap With Few Rows](#10-bus-matrix-table-gap-with-few-rows)
11. [Schema Layout — Dimensions Sprouting From Sides](#11-schema-layout--dimensions-sprouting-from-sides)
12. [Improving the Export Documentation](#12-improving-the-export-documentation)
13. [Testing S3 Connection](#13-testing-s3-connection)
14. [Light Mode](#14-light-mode)

---

## 1. Testing Database Connections

**Question:** What live databases can I connect to for testing the PostgreSQL profiling feature?

**Answer — Free Public PostgreSQL Databases:**

| Database | Host | Port | DB Name | User | Password | Notes |
|----------|------|------|---------|------|----------|-------|
| **RNAcentral** | `hh-pgsql-public.ebi.ac.uk` | 5432 | `pfmegrnargs` | `reader` | `NWDMCE5xdipIjRrp` | RNA sequences, ~50 tables, real scientific data |
| **Pagila (DVD Rental)** | Self-hosted | 5432 | `pagila` | varies | varies | Classic demo DB; needs local Docker setup |
| **Chinook** | Self-hosted | 5432 | `chinook` | varies | varies | Music store data; needs local Docker setup |

**Quickest option — run Pagila locally in Docker:**

```bash
docker run -d --name pagila -p 5432:5432 \
  -e POSTGRES_PASSWORD=test123 \
  ghusta/postgres-world-db:latest
```

Then connect with: host=`localhost`, port=`5432`, database=`world-db`, user=`world`, password=`world123`.

**Alternative — use RNAcentral directly** (no setup required):
- Host: `hh-pgsql-public.ebi.ac.uk`
- Port: `5432`
- Database: `pfmegrnargs`
- User: `reader`
- Password: `NWDMCE5xdipIjRrp`
- This is a read-only public database with real data, ideal for profiling tests.

**Recommendation:** Use the RNAcentral database for a quick smoke test since it needs zero setup. For a more realistic dimensional modelling test, spin up Pagila locally — it has a proper star-schema-like structure (films, actors, rentals, payments, etc.).

---

## 2. Green Dot Completion Indicator Timing

**Problem:** The green dot next to a stage name only shows up when you come back to the project later, not immediately after completing a stage.

**Root Cause:**  
The green dot is driven by `completedSteps` stored in the database (`ProjectState.completedSteps`). In `WizardLayoutClient.tsx` (line 68):

```tsx
const completedSteps = project.state?.completedSteps 
  ? JSON.parse(project.state.completedSteps) 
  : [];
const hasKnowledge = completedSteps.includes(step.id);
```

The `project` object is fetched once when the wizard layout mounts. When a stage completes (e.g., the requirements handoff at line 220 of `requirements/page.tsx`), it writes `completedSteps` to the database via the `/api/projects/[id]/state` PUT endpoint, then immediately navigates to the next page using `router.push()`.

The problem is that `WizardLayoutClient` does not re-fetch the project state after the PUT — it still holds the stale `project` object from the initial page load. The dot only appears on subsequent visits because that triggers a fresh fetch.

**Fix Plan:**
- Option A (simple): After each stage saves `completedSteps`, trigger a `router.refresh()` or use a shared state context (React Context or Zustand) so that `WizardLayoutClient` reactively updates.
- Option B (better): Create a `WizardContext` provider that holds `completedSteps` in React state. When any stage page writes to the state API, it also updates the context. `WizardLayoutClient` reads from context instead of the initial server prop.
- Option C (quickest): Add `router.refresh()` after the state PUT call in each stage's handoff function. This forces Next.js to re-run the server component and re-fetch project state.

**Estimated Complexity:** Low — Option C can be done in ~20 minutes across the 4–5 stage pages.

---

## 3. Key Callouts Not Appearing After Profiling

**Problem:** The "Key Profiling Callouts" section doesn't show up with new data after the rules-based profiling improvements.

**Root Cause:**  
The callout generation logic in `app/api/profile/route.ts` only triggers on three specific conditions:

1. `missingPct > 5` — column has more than 5% missing values
2. `type === 'date' && uniqueCount > 30` — date column with 30+ unique dates
3. `flags` contains `'HAS NEGATIVES'` — numeric column with negative values

If the test dataset has no missing values, no date columns (or dates with fewer than 30 unique values), and no negative numbers, then zero callouts are generated — and the UI correctly hides the section (`{callouts.length > 0 && (...)}`).

Additionally, the improved profiler in `lib/profiler.ts` now correctly reclassifies some columns:
- Zip codes → CATEGORICAL (no longer NUMERIC, so no negative check)
- Hex IDs → ID (no longer TEXT)
- Timestamps → DATE (but may still trigger the date callout if >30 unique values)

So the profiler is actually working better — it's just that the callout rules are too narrow.

**Fix Plan — Add More Callout Rules:**

```
New callout conditions to add:
- HIGH CARDINALITY: column flagged with >95% unique values and >1000 uniques
- POTENTIAL SURROGATE KEY: ID-type column detected (useful insight)
- LOW CARDINALITY NUMERIC: numeric column with <10 distinct values (might be categorical)
- OUTLIERS: column flagged with OUTLIERS flag from profiler
- UNIFORM DISTRIBUTION: all top values have similar percentages
- DATA TYPE MISMATCH: column name suggests one type but data says another
- COMPLETENESS SUCCESS: all columns have <1% missing (positive callout)
```

Also add a minimum callout guarantee — if zero callouts would be generated, create a summary callout like "All columns passed basic quality checks — no critical issues detected."

**Estimated Complexity:** Low-Medium — adding 4-5 new callout conditions and a fallback callout is ~30 minutes of work.

---

## 4. Left Sidebar Icons — Making Them Functional

**Current State:**  
The left sidebar in `WizardLayoutClient.tsx` has 5 icon buttons:

| Icon | Current State | Currently Does |
|------|--------------|----------------|
| LayoutDashboard (green) | Active-looking | Nothing (just styled green) |
| Database | Greyed out | Nothing |
| FolderGit2 | Greyed out | Nothing |
| TerminalSquare | Greyed out | Nothing |
| Settings (bottom) | Active | Links to `/settings/profile` |

**Recommended Functionality Plan:**

| Icon | Proposed Function | What It Would Do |
|------|-------------------|------------------|
| **LayoutDashboard** | Project Overview | Show a dashboard summary: project name, current stage, completion %, last modified, quick stats (tables uploaded, requirements banked, dimensions defined) |
| **Database** | Data Explorer | Open a slide-out panel showing uploaded tables, column list, sample data preview. Quick reference while working in any stage — avoids needing to go back to the upload/profile step |
| **FolderGit2** | Project Files / Artifacts | Show all generated artifacts: uploaded CSVs (with S3 links), exported SQL files, documentation. Basically a file manager for the project |
| **TerminalSquare** | Activity Log / Audit Trail | Show a timeline of actions: "Requirements banked at 2:30pm", "Bus matrix generated at 2:45pm", "Schema modified at 3:00pm". Useful for tracking what happened when |
| **Settings** | Project Settings | Keep as-is but also add project-specific settings (rename project, change description, manage team access) |

**Alternative (simpler):**

| Icon | Proposed Function |
|------|-------------------|
| **LayoutDashboard** | Navigate to project overview page (`/projects/[id]`) |
| **Database** | Navigate to upload/profile stage |
| **FolderGit2** | Navigate to export stage |
| **TerminalSquare** | Toggle a chat/agent panel from any stage |
| **Settings** | Keep as-is |

**Recommendation:** Start with the simpler version (navigation shortcuts) and upgrade to slide-out panels in a later sprint if time allows. The navigation shortcuts add real value with minimal effort.

**Estimated Complexity:**  
- Simple navigation version: Very low (~15 minutes)
- Full slide-out panel version: High (~2-3 days for data explorer + file manager)

---

## 5. Requirements Hierarchy Letters (P D K R)

**Answer:** The letters are filter tabs in the requirements hierarchy panel. They stand for:

| Letter | Meaning | Icon | Color |
|--------|---------|------|-------|
| **P** | Process (Business Processes / Facts) | Database | Blue |
| **D** | Dimension (Conformed Dimensions) | Layers | Purple |
| **K** | KPI (Key Performance Indicators / Metrics) | Target | Green |
| **R** | Rule (Business Rules) | Settings2 | Yellow |

There's also an "All" tab that shows everything unfiltered.

**UX Improvement Suggestion:** These single-letter tabs may not be immediately obvious to users. Consider:
- Showing the full word on hover (tooltip) — already partially done via the icon
- Using slightly wider tabs with abbreviated labels: "Proc", "Dim", "KPI", "Rule"
- Adding a small legend or help icon that explains the categories on first use

---

## 6. Adding Processes & Formulas Without the Agent

**Current State:** There is no "Add New Requirement" button. The only ways to create requirements are:

1. Chat with the BA Agent (it extracts and banks requirements from conversation)
2. Upload a document/image (agent parses and extracts)
3. Edit an existing requirement (Edit3 icon when a requirement is selected)
4. Delete an existing requirement

**Gap:** Users cannot manually create a requirement from scratch. If someone knows exactly what KPI they want (e.g., "Revenue per Customer = SUM(revenue) / COUNT(DISTINCT customer_id)"), they have to describe it to the agent and hope it extracts it correctly.

**Fix Plan:**
Add a "+" button at the top of the requirements hierarchy panel that opens an inline form or modal with fields for:
- Name (text input)
- Type (dropdown: Process / Dimension / KPI / Rule)
- Priority (dropdown: High / Medium / Low)
- Description (text area)
- Logic / Formula (code-style text area, for KPIs and Rules)

This form would directly push a new requirement object into the `requirements` state array without needing the agent.

**Estimated Complexity:** Low — the edit form already exists (used for inline editing). We just need to repurpose it for creation mode with an "Add" button.

---

## 7. Requirements Agent Intelligence — KPI & Formula Quality

**Current State:**  
The `REQUIREMENTS_INTERVIEWER` prompt in `lib/prompts.ts` does instruct the agent to:
- "Extract specific KPIs and Metrics with their technical logic/formulas"
- Capture formulas in the `logic` field of each requirement
- "Proactively suggest industry-standard KPIs if the user is stuck"

**Problem:** In practice, the agent sometimes produces KPIs without formulas, or with vague descriptions instead of actual calculation logic. This makes them useless in the bus matrix and schema stages.

**Fix Plan — Strengthen the Prompt:**

1. **Add explicit formula requirements** to the prompt:
   ```
   CRITICAL: Every KPI MUST have a concrete, executable formula in the 'logic' field.
   Bad example:  logic: "Calculate total revenue"
   Good example: logic: "SUM(order_items.price * order_items.quantity) WHERE orders.status = 'delivered'"
   
   If the user describes a KPI without a formula, ask them to clarify the calculation.
   If they can't, suggest a standard formula based on the data profile.
   ```

2. **Add a validation step** in the requirements page: before banking, check if any KPI-type requirements have an empty or vague `logic` field. Show a warning: "3 KPIs are missing formulas — these won't be useful in the bus matrix."

3. **Provide the data profile context** to the requirements agent so it can reference actual column names:
   ```
   Available tables and columns from the data profile:
   - orders: order_id, customer_id, order_date, total_amount, status
   - customers: customer_id, name, city, state
   
   Reference these actual column names when writing formulas.
   ```

**Estimated Complexity:** Medium — prompt changes are quick, but the validation UI and profile-context injection need careful wiring.

---

## 8. Coherence Across Requirements → Bus Matrix → Schema

**Current Data Flow:**

```
Requirements Page                Bus Matrix Generator              Schema Generator
─────────────────                ────────────────────              ─────────────────
bankedRequirements[]  ──save──►  reads bankedRequirements    ──►  reads busMatrix
  (name, type,                   reads profileResults              reads kpis
   priority, logic)              generates matrix via Claude        reads profileResults
                                                                   generates schema via Claude
```

**Where Things Can Get Lost:**

1. **Requirements → Bus Matrix:** The bus matrix generator receives `bankedRequirements` and `profileResults` but the prompt asks Claude to produce a matrix of processes × dimensions. KPIs with formulas are passed as context but Claude may not incorporate all of them — it's up to the LLM's interpretation.

2. **Bus Matrix → Schema:** The schema generator reads `busMatrix` and `kpis` separately. The `kpis` come from the old knowledge structure. If requirements were defined as "KPI" type in the new system but the old `kpis` array wasn't populated, the schema generator may miss them.

3. **No validation layer:** There's no check after bus matrix generation that says "these 3 requirements were in the input but not represented in the output." Same for schema generation.

**Fix Plan:**

1. **Add a coherence check after bus matrix generation:**
   - Compare banked requirement names against bus matrix rows/columns
   - Flag any requirement not represented: "Warning: 'Revenue per Customer' (KPI) is not mapped in the bus matrix"
   - Show this in the UI so the user can either regenerate or manually add it

2. **Add a coherence check after schema generation:**
   - Compare bus matrix processes against fact tables in the schema
   - Compare bus matrix dimensions against dimension tables
   - Flag missing elements

3. **Pass the full requirements context through every stage** (not just the bus matrix's output):
   - Schema generator should also receive `bankedRequirements` directly, not just the bus matrix
   - This gives Claude full context to include KPI formulas as computed columns or measures

4. **Unify the `kpis` and `bankedRequirements` data paths** so there's one source of truth

**Estimated Complexity:** Medium-High — the coherence checks need both backend logic and UI components, plus prompt adjustments.

---

## 9. Regeneration When Upstream Stages Change

**Current State:**

| Stage | Has Regenerate Button? | Picks Up Upstream Changes? |
|-------|----------------------|---------------------------|
| Bus Matrix | Yes ("Generate via AI") | Yes — re-reads banked requirements and profile data |
| Schema/Review | Yes ("AI Generate") | Yes — re-reads bus matrix from state |
| Export | No regenerate button | Reads from current schema nodes — reflects latest |

**Gap:** There's no automatic notification that upstream data has changed. If a user goes back and edits requirements, the bus matrix page doesn't show "Requirements have changed since this was generated — consider regenerating."

**Fix Plan:**

1. **Add timestamps to state data:**
   - When requirements are banked, store `requirementsBankedAt: Date.now()`
   - When bus matrix is generated, store `busMatrixGeneratedAt: Date.now()`
   - When schema is generated, store `schemaGeneratedAt: Date.now()`

2. **Show staleness warnings:**
   - On the bus matrix page, if `requirementsBankedAt > busMatrixGeneratedAt`, show a yellow banner: "Requirements have been updated since this bus matrix was generated. Click 'Generate via AI' to refresh."
   - Same pattern on schema page comparing against bus matrix timestamp.

3. **Optional: cascade regeneration button**
   - A single "Regenerate All Downstream" button on the requirements page that regenerates bus matrix → then schema in sequence

**Estimated Complexity:** Medium — timestamp tracking is easy, staleness UI banners are straightforward, cascade regeneration needs sequential API calls.

---

## 10. Bus Matrix Table Gap With Few Rows

**Problem:** When the bus matrix has fewer than 4 rows, there's visible whitespace/gaps in the table.

**Root Cause:**  
In `app/wizard/[projectId]/bus-matrix/page.tsx`, each matrix cell has:
```tsx
minHeight: '60px'
```
And the grid container has:
```tsx
minHeight: '300px'
```

With only 1–3 rows (processes), the cells are stretched vertically to fill the container's minimum height, creating awkward gaps.

**Fix Plan:**
- Remove or reduce `minHeight: '300px'` on the grid container — let it shrink naturally
- Change cell `minHeight: '60px'` to `minHeight: '40px'` or remove it entirely
- Use `height: auto` on the container and let the content determine the size
- Optionally: if fewer than 4 rows, add a subtle "Add more processes in the requirements stage" hint row

**Estimated Complexity:** Very low — ~10 minutes of CSS adjustments.

---

## 11. Schema Layout — Dimensions Sprouting From Sides

**Problem:** Neil asked that dimensions sprout from the sides of fact tables and lay horizontally, not fan out from the top.

**Current Layout Algorithm** (in `review/page.tsx`, `layoutStarSchema`):

```tsx
const angle = angleStep * (j + 1) - Math.PI / 2;  // starts at top (-π/2)
dim.position = {
  x: 500 + Math.cos(angle) * radius,
  y: yOffset + Math.sin(angle) * radius
};
```

This creates a **semicircle arc starting from the top** of the fact table. Dimensions fan upward and to the sides.

**Fix Plan — Side-Sprouting Layout:**

Replace the current polar coordinate approach with a horizontal layout:

```
Option A: Left-Right Split
─────────────────────────
     [Dim1]                [Dim4]
     [Dim2]   ── [FACT] ── [Dim5]
     [Dim3]                [Dim6]

Fact in center, half the dimensions stacked on the left, half on the right.
```

```
Option B: Full Radial (4 sides)
────────────────────────────────
              [Dim1]
     [Dim4] ── [FACT] ── [Dim2]
              [Dim3]

Dimensions distributed evenly around all 4 sides (top, right, bottom, left).
```

**Recommended approach (Option A):**

```tsx
// Split dims into left and right halves
const leftDims = factDims.slice(0, Math.ceil(factDims.length / 2));
const rightDims = factDims.slice(Math.ceil(factDims.length / 2));

// Stack left dims vertically, centered on fact's Y
leftDims.forEach((dim, j) => {
  const ySpacing = 120;
  const totalHeight = (leftDims.length - 1) * ySpacing;
  dim.position = {
    x: factX - 400,  // to the left
    y: factY - totalHeight / 2 + j * ySpacing
  };
});

// Same for right
rightDims.forEach((dim, j) => {
  const ySpacing = 120;
  const totalHeight = (rightDims.length - 1) * ySpacing;
  dim.position = {
    x: factX + 400,  // to the right
    y: factY - totalHeight / 2 + j * ySpacing
  };
});
```

**Estimated Complexity:** Low-Medium — the math is straightforward, but needs testing with varying numbers of dimensions and multiple fact tables.

---

## 12. Improving the Export Documentation

**Current State:**  
The export generates three files:
1. **SQL dbt models** — one `.sql` file per table (incremental for facts, table for dims)
2. **YAML schema** — `_marts__models.yml` with column tests
3. **Markdown documentation** — `documentation.md` with requirements, schema structure, relationships

**What's Missing for Client-Ready Documentation:**

| Gap | Description | Priority |
|-----|-------------|----------|
| Business glossary | No definition of business terms used in the model | High |
| Data dictionary | Column descriptions are generic ("Primary Key", "Standard column") | High |
| Source-to-target mapping | No traceability from source columns to model columns | High |
| Data lineage diagram | No visual showing data flow from source → staging → marts | Medium |
| SCD handling notes | No documentation of slowly changing dimension strategies | Medium |
| Data quality rules | No documented validation rules or thresholds | Medium |
| Governance metadata | No data owner, steward, classification, retention info | Medium |
| Executive summary | No plain-English overview of what the model does and why | High |
| ERD diagram | The schema visual isn't exported as an image in the doc | Low |
| Change log | No version history or change tracking | Low |

**Fix Plan — Enhanced Documentation Generator:**

1. **Use Claude to generate rich descriptions:** Instead of hardcoded "Primary Key" descriptions, send the full schema + requirements context to Claude and ask it to write business-friendly column descriptions.

2. **Add an executive summary section:** Have Claude write a 1-page overview: "This dimensional model supports analysis of [business area]. It contains X fact tables tracking [processes] and Y dimension tables providing context on [entities]."

3. **Add a data dictionary section:** For each table, include: purpose, grain, update frequency, source system, key business rules.

4. **Add source-to-target mapping:** If profile data is available, map source CSV columns to their target model columns.

5. **Include the requirements traceability:** Show which banked requirement maps to which table/column.

6. **Format as a proper Word/PDF document** using a template, not just Markdown (stretch goal).

**Estimated Complexity:** Medium — most improvements involve prompt engineering to get Claude to generate richer content. The document structure changes are straightforward.

---

## 13. Testing S3 Connection

**How to Test S3 Is Working:**

**Step 1 — Verify Environment Variables**

Check your `.env.local` file has these set:
```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=your_region           # e.g., af-south-1 or us-east-1
S3_BUCKET_NAME=dim-wiz-uploads   # or whatever you named your bucket
```

**Step 2 — Quick CLI Test (without running the app)**

Run this in PowerShell to verify AWS credentials and bucket access:
```powershell
# Install AWS CLI if not already installed
# Then test:
aws s3 ls s3://dim-wiz-uploads/ --region af-south-1

# Or upload a test file:
aws s3 cp test_data/products.csv s3://dim-wiz-uploads/test/products.csv
aws s3 ls s3://dim-wiz-uploads/test/
aws s3 rm s3://dim-wiz-uploads/test/products.csv
```

**Step 3 — Test Through the App**

1. Start the dev server: `npm run dev`
2. Create a project and go to the Upload stage
3. Upload a small CSV file (like `test_data/products.csv`)
4. Click "Run Profiler"
5. Check the server console for either:
   - Success: no S3 warnings in the console
   - Failure: `S3 upload failed (profiling will continue): ...` message
6. Verify in S3: `aws s3 ls s3://dim-wiz-uploads/projects/`

**Step 4 — Verify Database Record**

After uploading, check that the file was recorded:
```bash
npx prisma studio
```
Look at the `UploadedFile` table — you should see a row with `s3Key` populated.

**Common Issues:**
- `AccessDenied` → bucket policy doesn't allow your IAM user to PutObject
- `NoSuchBucket` → bucket name in `.env.local` doesn't match what you created
- `InvalidAccessKeyId` → wrong credentials in `.env.local`
- Region mismatch → bucket is in `af-south-1` but config says `us-east-1`

**Note:** S3 is best-effort in the current code — if S3 fails, profiling still works. The CSV data is processed in-memory regardless. S3 just stores a backup copy.

---

## 14. Light Mode

**Problem:** Neil asked for a light mode option. Currently the platform is exclusively dark mode.

**Current Theming:**  
The app uses CSS custom properties defined in `app/globals.css` (e.g., `--color-black`, `--color-white`, `--color-green`, etc.) and inline styles referencing these variables throughout all components.

**Fix Plan:**

1. **Define light mode CSS variables:**
   ```css
   [data-theme="light"] {
     --color-black: #ffffff;
     --color-black-light: #f5f5f5;
     --color-white: #1a1a1a;
     --color-white-muted: #666666;
     --color-border: #e0e0e0;
     --color-green: #16a34a;
     /* ... etc */
   }
   ```

2. **Add a theme toggle** in the Settings page and/or the top navigation bar — a sun/moon icon button.

3. **Store the preference** in localStorage and/or the user's profile in the database.

4. **Apply the theme** by setting `data-theme="light"` or `data-theme="dark"` on the `<html>` element.

**Complexity Assessment:**
- If all colors use CSS variables consistently → Medium effort (define variables + toggle)
- If inline styles use hardcoded hex values → High effort (need to find and replace every hardcoded color)

**Reality check:** The codebase uses a mix of CSS variables AND hardcoded colors in inline styles. A full audit of every component is needed to ensure light mode doesn't produce invisible text, unreadable buttons, or broken contrast.

**Estimated Complexity:** Medium-High — variable definitions are easy, but auditing and fixing 30+ component files with inline styles will take time. Recommend doing this as a dedicated sprint task.

---

## Summary — Priority & Effort Matrix

| # | Issue | Priority | Effort | Sprint |
|---|-------|----------|--------|--------|
| 10 | Bus matrix table gap | High (visual bug) | Very Low | Current |
| 2 | Green dot timing | High (UX bug) | Low | Current |
| 3 | Callouts not appearing | High (feature gap) | Low-Med | Current |
| 6 | Manual add requirement | High (workflow gap) | Low | Current |
| 11 | Schema layout sides | High (Neil request) | Low-Med | Current |
| 7 | Agent KPI intelligence | High (quality) | Medium | Current |
| 8 | Stage coherence | High (data integrity) | Med-High | Next |
| 9 | Regeneration warnings | Medium (UX) | Medium | Next |
| 4 | Sidebar functionality | Medium (UX) | Low-Med | Next |
| 12 | Export documentation | Medium (quality) | Medium | Next |
| 14 | Light mode | Medium (Neil request) | Med-High | Future |
| 1 | Test DB connection | N/A (answered) | N/A | N/A |
| 5 | P D K R meaning | N/A (answered) | N/A | N/A |
| 13 | Test S3 connection | N/A (answered) | N/A | N/A |

**Recommended order for current sprint:**
1. Bus matrix table gap (10 min)
2. Green dot timing (20 min)
3. Callouts expansion (30 min)
4. Manual "Add Requirement" button (30 min)
5. Schema layout fix (45 min)
6. Agent prompt improvements (30 min)
