# Dim-Wiz Platform — Development Roadmap

> **Date:** 13 May 2026
> **Author:** Sechaba
> **Status:** Active — Post May 12 Check-in with Neil Lategan
> **Focus:** UI & Workflow Changes (not backend infrastructure)

---

## Context

Following the May 12 Capstone Check-In, the immediate priority is **UI and workflow improvements** to the core modelling flow. Backend infrastructure work (S3, RDS, GitHub) is explicitly deferred. This roadmap only contains outstanding work — everything already implemented has been removed.

### What's Already Working

The following are built and functional:

- ✅ Auth (NextAuth + credentials), login, registration, sessions
- ✅ Project creation & dashboard with "data-first" vs "requirements-first" entry path
- ✅ CSV upload & ingestion (drag-and-drop, multi-file)
- ✅ Data profiling (deterministic, Kaggle-style stats, histograms, flags) — deemed "good enough" for clean CSVs
- ✅ AI profile interpretation (Claude via Bedrock)
- ✅ Requirements interview (multi-turn chat, text/markdown file upload, KPI extraction)
- ✅ Bus Matrix (AI-generated or manual, editable grid with add/delete process/dimension)
- ✅ Star schema editor (ReactFlow visual ERD, YAML view, AI chat modification, PNG export, re-layout, manual table/column editing, cardinality labels on edges)
- ✅ Code generation output (dbt SQL, file explorer)
- ✅ Shared Knowledge Store (`lib/knowledge.ts` with `KnowledgeContext` interface, `getKnowledge`, `updateKnowledge`, `getKnowledgeSummary`)
- ✅ Modular tab navigation (all tabs unlocked, green dot knowledge indicators, no locking logic)
- ✅ Star schema layout algorithm (`layoutStarSchema` — facts centered, dimensions in radial arc)

### What's Been Deprioritized (Parked)

These items were discussed but Neil explicitly said to **pause or defer**:

- ⏸️ GitHub integration — Paused entirely. Focus on core modelling flow first.
- ⏸️ S3 file storage — Files are in-memory. Can wait.
- ⏸️ SQLite → PostgreSQL/RDS migration — Can wait.
- ⏸️ Live database connector (Postgres profiling) — Next sprint, after UI work is done.

---

## Sprint 1 — Requirements UX Overhaul (Before Next Meeting)

> **Nature of work:** This is primarily a **UI and workflow** effort, not deep backend work. The focus is on getting the screens, flows, and structured outputs right.

### Visual Inspiration

Neil shared reference screenshots during the meeting. These are saved in:
- `transcipt/image (3).png` — Knowledge Base Interactive Viewer (hierarchy panel + detail view)
- `transcipt/image (4).png` — Process Hierarchy + Central Explorer + Logic Explorer
- `transcipt/image (5).png` — Tabular Analytics/Testing View

These are not meant to be copied exactly but should inspire the structured layout.

---

### 1. Restructure the Requirements Page into a Three-Pane Layout

**Current state:** The requirements page (`app/wizard/[projectId]/requirements/page.tsx`) is a two-panel layout:
- Left: Chat conversation with a file upload zone at the top
- Right: "Extracted KPI Models" panel showing editable formula cards

**What Neil wants:** A structured, multi-pane requirements workspace:

| Left Pane | Center Pane | Right Pane |
|---|---|---|
| **Requirements Hierarchy** — A clickable list of all extracted requirements, organized and browsable | **Main Explorer/Editor** — The chat/document viewer. When a requirement is clicked in the left pane, its full detail appears here | **Logic/Detail Panel** — A secondary view for formulas, KPIs, and business rules |

**Key changes:**
- The left pane replaces the current implicit requirement list. Each extracted requirement should appear as a discrete, clickable item in a sidebar hierarchy.
- Users must be able to **review, edit, delete, and reprioritize** individual requirements.
- **Formulas demotion:** Neil said the current KPI formulas panel is "weak" as the primary right-hand output. Formulas should be **demoted** from the dominant right-side view into a secondary detail/logic explorer. They are still useful, but should not be the main thing the user sees.

**File to modify:** `app/wizard/[projectId]/requirements/page.tsx`

---

### 2. Rework the Requirements Agent Prompt (Business Analyst Role)

**Current state:** The `REQUIREMENTS_INTERVIEWER` prompt in `lib/prompts.ts` is a general "data architect and business analyst" that conducts a requirements interview and emits a `---KPI_EXTRACT---` JSON block.

**What Neil wants:** The first agent should behave specifically as a **Business Analyst** whose job is to:
- Extract, structure, and format requirements from uploaded context material
- Produce a clear, organized requirements document — not just a conversation
- Output structured "banked" requirements that can be handed off cleanly to the next stage

**What to change in `lib/prompts.ts`:**
- Rename the role framing from "senior data architect" to "senior Business Analyst"
- Expand the `---KPI_EXTRACT---` output to include a structured list of **banked requirements** (not just KPIs), each with a name, description, priority, and category (e.g., business process, dimension, KPI, business rule)
- This banked output is what gets persisted and handed to the Bus Matrix stage

---

### 3. Fix the Requirements → Bus Matrix Handoff

**Current state:** The Bus Matrix generation route (`app/api/projects/[id]/bus-matrix/generate/route.ts`) reads the full `stateData` (chat history, KPIs, profiling data) and dumps it all into the AI prompt. The transition between Requirements and Bus Matrix is incoherent — extracted business processes and dimensions don't flow through clearly.

**What Neil wants:** The handoff should emulate a professional handover — as if a Business Analyst produced a stack of structured requirement papers and handed them to a Data Warehouse Designer. The Bus Matrix should consume the **banked requirements output** specifically, not raw chat history.

**What to change:**
- The Requirements page should produce a clear "Banked Requirements" data structure (list of finalized processes, KPIs, dimensions, business rules) and persist it to `stateData`
- Update `app/api/projects/[id]/bus-matrix/generate/route.ts` to consume this banked output instead of raw context
- Update the `BUS_MATRIX_GENERATOR` prompt in `lib/prompts.ts` to frame the AI as a **Data Warehouse Designer** receiving structured requirements from a BA

**Note:** The Bus Matrix screen itself is acceptable. The problem is entirely with the input quality.

---

### 4. Add a "Bank Requirements" Action

**Current state:** The Requirements page has a "Proceed to Bus Matrix" button that just navigates to the next step without explicitly saving a structured output.

**What to build:**
- Before proceeding, the system should compile all extracted requirements, KPIs, dimensions, and business rules into a structured "Banked Requirements" object
- Store this in `stateData` under a dedicated key (e.g., `bankedRequirements`)
- Show the user a summary/review of what's being banked before handoff
- This becomes the contract between the BA agent and the DWH Designer agent

---

## Sprint 2 — Data Input Paths (After UI Work)

> Only start this after Sprint 1 is complete. Neil said these can wait.

### 5. PostgreSQL Database Connection

The platform should support **two co-equal data input paths**:
1. **File-based ingestion:** CSV upload via the frontend (already working)
2. **Direct database profiling:** Connect to a PostgreSQL database and profile live tables

The "Live DB" tab in `app/wizard/[projectId]/upload/page.tsx` currently has a connection form UI but no backend. Build the actual connection logic.

### 6. S3 File Storage

Uploaded CSVs should be stored in S3 for persistence. Currently they are processed in-memory and lost on refresh.

---

## Backlog — Lower Priority / Cosmetic

These items are acknowledged but not urgent:

| Item | Notes |
|---|---|
| Schema layout (facts center, dims around) | A `layoutStarSchema` function exists and works. Neil says it still "irritates" him but is acceptable for now |
| Image/screenshot upload in Requirements | Platform should eventually support images alongside text. Not just text-only thinking |
| Dark/light theme preferences | Cosmetic refinement, not a blocker |
| Documentation export (Markdown, ERD) | Future capability |
| BI semantic layer outputs (dbt metrics, DAX) | Future capability |

---

## Testing

**New primary test dataset:** The **Brazilian E-Commerce Public Dataset by Olist** on Kaggle.
- ~100,000 orders from 2016–2018
- Tables: **orders, payments, freight, customers, products, reviews, sellers, geolocation**
- Significantly richer than a single flat CSV — ideal for validating profiling, requirements extraction, and schema generation

---

## Key Files for Sprint 1

| File | What to Change |
|---|---|
| `app/wizard/[projectId]/requirements/page.tsx` | Rebuild into three-pane layout with requirements hierarchy, formulas demotion |
| `lib/prompts.ts` | Rework `REQUIREMENTS_INTERVIEWER` to BA role; rework `BUS_MATRIX_GENERATOR` to DWH Designer role |
| `app/api/projects/[id]/bus-matrix/generate/route.ts` | Consume banked requirements instead of raw context |
| `app/api/projects/[id]/chat/route.ts` | Update to produce structured banked requirements output |