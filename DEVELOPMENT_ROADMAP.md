# Dim-Wiz Platform — Master Roadmap

> **Date:** 11 May 2026
> **Author:** Sechaba
> **Status:** Planning — Awaiting Review

---

## Executive Summary

The Dim-Wiz platform is a working prototype that can ingest CSV data, profile it, interview the user for requirements, generate a Bus Matrix, architect a visual star schema, and produce dbt-style code output. All AI agents run on Claude via AWS Bedrock, and the app uses Next.js + Prisma + SQLite locally.

The most recent feedback session with Neil and Heinrich confirmed two things:

1. **The platform has real value.** Heinrich specifically said he sees a direct use case for this in real client consulting work — speeding up data model development and review.
2. **The current structure is too rigid.** The linear wizard flow (Ingest → Profile → Requirements → Bus Matrix → Schema → Code → Deploy) needs to become modular, where each step contributes knowledge to a shared context, and the user can enter from multiple starting points.

This roadmap is divided into **four phases** that balance finishing what's already in progress with implementing the structural changes required by the feedback.

---

## Current State — What Exists Today

| Component | Status | Notes |
|---|---|---|
| Auth (NextAuth + credentials) | ✅ Working | Login, registration, sessions |
| Project creation & dashboard | ✅ Working | Create projects, resume sessions |
| CSV upload & ingestion | ✅ Working | Drag-and-drop, multi-file |
| Data profiling (deterministic) | ✅ Working | Kaggle-style column stats, histograms, flags |
| AI profile interpretation | ✅ Working | Claude via Bedrock |
| Requirements interview (chat) | ✅ Working | Multi-turn chat, doc upload, KPI extraction |
| Bus Matrix generation | ✅ Working | AI-generated, editable grid |
| Star schema editor (ReactFlow) | ✅ Working | Visual ERD, node editing, AI chat modification |
| Code generation output | ✅ Working | dbt SQL output, file explorer, terminal simulation |
| Deploy page | ⚠️ Simulated | UI present, deployment logic is mocked |
| Live DB connector | ⚠️ UI only | Connection form exists, no actual DB connection |
| S3 file storage | ❌ Not started | Files are handled in-memory, no persistence to S3 |
| RDS database connection | ❌ Not started | `awsConfig` exists but no RDS client |
| SQLite → cloud DB migration | ❌ Not started | Prisma uses local `dev.db` |
| GitHub integration | ❌ Not started | `repo` field exists on Project model, no Git API calls |
| Documentation export | ❌ Not started | Not yet in scope |
| Scheduling / orchestration | ⚠️ UI only | Schedule selectors exist, no backend logic |

---

## Phase 1 — Complete Outstanding Backend Integrations

> **Goal:** Finish everything that was already planned but not yet functional, so the platform can operate end-to-end as a real tool rather than a simulation.
> **Priority:** High — Do this first.
> **Estimated effort:** 2–3 weeks

### 1A. File Storage → AWS S3

**Why:** Currently, uploaded CSV files are processed in-memory during the profiling step and never persisted. If the user refreshes or returns later, the raw files are gone. The `UploadedFile` model already has an `s3Key` field but nothing writes to S3.

**What to build:**
- Add `@aws-sdk/client-s3` dependency
- Create `lib/s3.ts` with `uploadFile(buffer, key)` and `getFile(key)` functions using the existing `awsConfig` from `lib/aws.ts`
- Update the `/api/profile` route to upload each CSV to S3 before profiling
- Store the S3 key in the `UploadedFile` table
- Add a download/retrieval function for when files need to be re-read later

**Environment variables needed:**
```
AWS_S3_BUCKET=dimwiz-uploads
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

### 1B. Database → AWS RDS (PostgreSQL)

**Why:** The platform currently runs on a local SQLite file (`prisma/dev.db`). This works for development but won't work for deployment, multi-user access, or any real client use.

**What to build:**
- Provision an RDS PostgreSQL instance on AWS
- Update `prisma/schema.prisma` — change `provider` from `"sqlite"` to `"postgresql"` and update the connection URL
- Run `npx prisma migrate dev` to generate PostgreSQL migrations
- Test all existing queries against PostgreSQL (SQLite and PostgreSQL have minor syntax differences)
- Update `DATABASE_URL` in `.env` to point to the RDS instance

**Migration script pattern:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Important:** The `stateData` field on `ProjectState` stores JSON as a string. This works in both SQLite and PostgreSQL, but consider switching to a native `Json` type in PostgreSQL for better queryability.

### 1C. Live Database Connector (Ingestion Page)

**Why:** The ingestion page has a "Live DB" tab with a connection form (`upload/page.tsx:367–436`), but clicking "Test & Connect" just toggles a local state variable. It doesn't actually connect to any database.

**What to build:**
- Create `/api/projects/[id]/connect-db` route
- Accept connection parameters (engine, host, port, database, username, password)
- Use a pooling library (e.g., `pg` for PostgreSQL, `mysql2` for MySQL) to test the connection
- On success, query `information_schema.tables` and `information_schema.columns` to get the schema metadata
- Return the table list to the frontend
- Allow the user to select tables, then pull a sample (e.g., first 100 rows) for profiling
- Pipe the sample through the existing profiling logic

**Security consideration:** Store connection credentials encrypted, not in plain text. Consider using AWS Secrets Manager.

### 1D. GitHub Integration

**Why:** The project creation form already has a "Target Git Repository" field, and the deploy page simulates a Git push. The actual GitHub API integration is not yet built.

**What to build:**
- Add GitHub OAuth or Personal Access Token (PAT) support
- Create `/api/github/connect` route for authentication
- Create `/api/projects/[id]/push-to-github` route that:
  - Creates a branch (e.g., `dimwiz/model-<projectId>`)
  - Commits the generated dbt/SQL files
  - Creates a Pull Request
- Update the Deploy page to call the real GitHub push instead of simulating it
- Store the GitHub connection per user or per project

**Dependencies:** `@octokit/rest` for GitHub API interaction

---

## Phase 2 — UX Restructuring: Linear → Modular

> **Goal:** Transform the platform from a strictly sequential wizard into a modular workspace where steps contribute knowledge independently and the user can enter from different starting points.
> **Priority:** High — This was the single biggest outcome of the feedback session.
> **Estimated effort:** 3–4 weeks
> **When:** After Phase 1, or partially in parallel if capacity allows.

### Why This Matters

The current wizard layout in `WizardLayoutClient.tsx` enforces a strict linear flow:

```
Ingest → Profile → Requirements → Bus Matrix → Schema Editor → Code Gen → Deploy
```

Steps that haven't been completed are locked (greyed out, `cursor: not-allowed`). This means a user **must** upload data before they can define requirements. Heinrich explained that this doesn't reflect real consulting work, where often:

- You start with business requirements and no data
- You have an industry template and want to propose a model before data exists
- You want to jump to the schema editor to sketch ideas

Neil added that each step should contribute to a **shared knowledge base**, and the system should be able to generate useful output from whatever knowledge is available.

### 2A. Architecture: The Shared Knowledge Store

**Concept:** Instead of each step simply passing data to the next step, every step reads from and writes to a shared **Knowledge Context** for the project. This context is the unified state that any step can access.

**Current state:** The `ProjectState.stateData` JSON blob already stores data for each step, but each step only reads its own data and the previous step's output. The restructure would make every step aware of the full context.

**What to build:**
- Define a formal `KnowledgeContext` TypeScript interface:

```typescript
interface KnowledgeContext {
  // Data knowledge (from ingestion + profiling)
  uploadedFiles?: FileMetadata[];
  profileResults?: ProfileResults;
  aiInterpretation?: string;

  // Business knowledge (from requirements)
  chatHistory?: ChatMessage[];
  kpis?: KPI[];
  dimensions?: DimensionSpec[];
  businessRules?: BusinessRule[];
  grain?: string;

  // Industry/template knowledge (future: from requirements-first path)
  industryContext?: string;
  templateId?: string;

  // Structural knowledge (from bus matrix + schema)
  busMatrix?: BusMatrix;
  schema?: SchemaDefinition;

  // Output knowledge (from code gen)
  generatedCode?: GeneratedFile[];
}
```

- Create a `lib/knowledge.ts` module with:
  - `getKnowledge(projectId)` — load the full context
  - `updateKnowledge(projectId, partial)` — merge new knowledge
  - `getKnowledgeSummary(projectId)` — return a text summary of what's known (for AI prompts)

### 2B. Dual Entry Paths

**Concept:** When a user creates a new project, they should be asked how they want to start:

```
┌─────────────────────────────────┐
│    How do you want to start?    │
│                                 │
│  ┌───────────┐  ┌────────────┐  │
│  │ I have    │  │ I have     │  │
│  │ source    │  │ business   │  │
│  │ data      │  │ context    │  │
│  └───────────┘  └────────────┘  │
└─────────────────────────────────┘
```

**Path A — Data-First (current flow):**
1. Upload CSVs or connect to a live database
2. Profile the data
3. AI interprets the profiles
4. Define requirements (with data context already available)
5. Generate Bus Matrix → Schema → Code

**Path B — Requirements-First (new):**
1. Start with the Requirements chat
2. Upload business context docs, dashboard specs, or describe the problem verbally
3. AI proposes candidate dimensions, facts, and KPIs based on industry knowledge
4. Generate a proposed Bus Matrix → Schema
5. Later, when data becomes available, connect data and compare against the proposed model

**What to build:**
- Add a "project type" or "entry path" selector after project creation (in `ProjectsClient.tsx`)
- Store the selected path in the project state
- For Path B, the Requirements page becomes the landing page instead of Upload
- Update AI prompts to handle the case where no profiling data exists yet

### 2C. Unlock All Tabs

**What to change:** Remove the locking logic from `WizardLayoutClient.tsx:72–88` so that all tabs are always navigable.

**What to add instead:**
- Each tab should show an **empty state** with a clear explanation of what's missing
- For example, if the user navigates to "Schema Editor" before profiling data:
  - Show: *"No schema generated yet. You can sketch a model manually, or complete Profiling + Requirements to auto-generate one."*
  - Offer a "Start from Scratch" button that lets them add tables manually
- Each tab header should show a **knowledge indicator** — a small badge showing whether that step has contributed knowledge to the context:
  - 🟢 = Knowledge contributed
  - ⚪ = No knowledge yet
  - 🔄 = Knowledge outdated (upstream changed)

### 2D. Update Navigation UX

**Current:** Linear breadcrumb with chevrons and locked steps.

**Proposed:** A tab-style navigation where each tab is always accessible, with visual indicators:

```
┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│ 🟢 Data  │ 🟢 Prof. │ ⚪ Reqs  │ ⚪ Matrix │ ⚪ Schema │ ⚪ Code  │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
```

- Tabs should feel like workspace panels, not sequential steps
- The active tab is highlighted with the green accent color
- The "Deploy" step should be downgraded to a button/action within Code Gen, not a full tab (per feedback that scheduling is not a primary focus)

---

## Phase 3 — Schema Visual & Output Improvements

> **Goal:** Improve the schema editor and add documentation export capabilities.
> **Priority:** Medium — These were specific, actionable pieces of feedback.
> **Estimated effort:** 2–3 weeks
> **When:** After Phase 2, or interleaved.

### 3A. Star Schema Layout: Facts in Center, Dimensions Around

**Feedback from Neil:** The current schema layout places nodes somewhat randomly. Facts should be in the middle, and dimensions should sit around them in a radial or grid pattern.

**Current:** The schema generator returns node positions but they're not laid out in a star pattern. The ReactFlow canvas in `review/page.tsx` just places them wherever the AI or the user positions them.

**What to build:**
- Create a `layoutStarSchema(nodes, edges)` function that:
  1. Identifies fact tables (nodes where `type === 'factNode'`)
  2. Places facts in the center of the canvas, spaced vertically
  3. For each fact, arranges its connected dimensions in a radial arc around it
  4. Dimensions shared between facts are positioned between them
- Call this layout function on schema load and add a "Re-layout" button
- Use an algorithm like concentric circles or force-directed layout with fixed center

**Visual reference:**
```
                dim_customer
               /            \
  dim_date --- FACT_SALES --- dim_product
               \            /
                dim_store

              dim_promotion
               /
  dim_date --- FACT_INVENTORY --- dim_product
               \
                dim_warehouse
```

### 3B. Relationship Cardinality Labels

**Feedback from Heinrich:** The schema view should show relationship types (one-to-many, one-to-one) on the edges, not just that tables are connected.

**What to build:**
- Extend the edge data model to include a `cardinality` field (e.g., `"1:M"`, `"1:1"`, `"M:M"`)
- In the schema generator prompt, ask Claude to specify cardinality for each relationship
- Render cardinality labels on the edges in the ReactFlow canvas using custom edge labels
- Add the ability to edit cardinality by clicking on an edge

### 3C. Documentation Export

**Feedback from Heinrich:** The platform would become much more valuable if it could generate documentation outputs that can be used directly in client deliverables.

**What to build (incrementally):**

| Export Format | Priority | Description |
|---|---|---|
| Markdown | High | A structured `.md` file documenting all tables, columns, relationships, data types, and the reasoning behind the model |
| ERD Image (PNG/SVG) | Medium | Export the current ReactFlow canvas as a downloadable image |
| draw.io XML | Low | Generate a `.drawio` compatible XML file so the ERD can be opened and edited in diagrams.net |
| Word/PDF | Future | Generate a client-themed document (would require a templating engine like docx-templates) |

---

## Phase 4 — Future Product Extensions

> **Goal:** Implement the broader product vision items suggested in the meeting.
> **Priority:** Lower — These expand the platform's value but depend on Phases 1–3 being solid.
> **Estimated effort:** 4–6 weeks (spread over time)
> **When:** After Phases 1–3 are complete.

### 4A. Requirements-Only / Proposal Mode

**Concept from Heinrich:** A consultant should be able to use the platform to design a data model **before** they have any real data. They would:
1. Describe the business problem and industry
2. Upload proposal documents, dashboard mockups, or reporting specs
3. The AI proposes a best-fit dimensional model based on industry patterns
4. Later, when data arrives, the actual data is profiled and compared against the proposed model
5. The system highlights differences and suggests amendments

**What to build:**
- Add industry template profiles (e.g., Retail, Healthcare, Finance, Telecommunications)
- Create a "Model Proposal" AI prompt that generates a schema from requirements + industry context alone
- Build a "Data vs. Model Comparison" view that shows:
  - Columns in the data that aren't in the model
  - Model tables that have no data source yet
  - Type mismatches or naming differences

### 4B. Semantic / BI Layer Outputs

**Concept from Heinrich:** Beyond the warehouse model, generate outputs that support BI tools.

**What to build (future):**
- Generate Power BI measure definitions (DAX)
- Generate dbt metrics/semantic layer YAML
- Generate LookML model files for Looker
- Generate Tableau calculated fields

This is a significant expansion and should be scoped carefully once the core platform is stable.

### 4C. Industry Templates & Pre-Built Models

**Concept:** Allow users to start from a known-good model rather than from scratch.

**What to build:**
- A template library with pre-built dimensional models:
  - Retail (Sales, Inventory, Promotions)
  - Financial Services (Transactions, Accounts, Products)
  - Healthcare (Patient Encounters, Claims)
  - SaaS (Subscriptions, Usage, Support)
- Users can select a template, then customize it through the schema editor
- Templates include pre-filled Bus Matrices, KPIs, and documentation

---

## Phase Summary & Sequencing

| Phase | Focus | Duration | Depends On |
|---|---|---|---|
| **Phase 1** | Backend integrations (S3, RDS, Live DB, GitHub) | 2–3 weeks | Nothing — start immediately |
| **Phase 2** | UX restructure (Knowledge Store, dual paths, unlock tabs) | 3–4 weeks | Phase 1 (or partial overlap) |
| **Phase 3** | Schema visual & export (star layout, cardinality, docs) | 2–3 weeks | Phase 2 (or interleaved) |
| **Phase 4** | Product extensions (proposal mode, BI outputs, templates) | 4–6 weeks | Phases 1–3 complete |

---

## Quick Reference: What Changed vs. Original Plan

| Original Plan | Meeting Feedback | Action |
|---|---|---|
| Linear wizard flow | Steps should be modular, not locked | **Phase 2** — Restructure to modular tabs |
| Data-first only | Support requirements-first entry | **Phase 2B** — Dual entry paths |
| Schema nodes arranged freely | Facts center, dims around, star layout | **Phase 3A** — Layout algorithm |
| Edges show connections only | Show cardinality (1:M, 1:1) | **Phase 3B** — Edge labels |
| No documentation export | Generate markdown, ERD, client docs | **Phase 3C** — Export capabilities |
| Scheduling was a full step | Scheduling is not core value | **Phase 2D** — Downgrade to action in Code Gen |
| Deploy was a major phase | Focus on model quality, not deployment | De-prioritize, keep as lightweight action |
| No proposal/pre-sales mode | Requirements-only modelling is valuable | **Phase 4A** — Proposal mode |
| Warehouse-only output | BI semantic layer outputs | **Phase 4B** — Future BI exports |
| Restructure later | Restructure NOW, not later | **Phase 2** runs immediately after Phase 1 |

---

## Non-Negotiable Principles

1. **The AI proposes, the user confirms.** Every AI-generated artifact (schema, KPIs, bus matrix) is a suggestion that the user reviews and approves before it becomes part of the model.

2. **Knowledge is additive.** Every interaction — uploading a file, chatting with the requirements agent, editing the bus matrix — adds to the shared knowledge context. Nothing is lost when switching between tabs.

3. **The platform should work with partial knowledge.** If only requirements exist (no data), the system should still generate a useful model. If only data exists (no requirements), it should still profile and suggest structure.

4. **Premium feel is mandatory.** The dark-mode, IDE-style aesthetic is part of the product's identity. Every new feature must maintain this standard.

---

## Key Files Reference

| File | Purpose | Impact |
|---|---|---|
| `components/WizardLayoutClient.tsx` | Main navigation shell | Key file for Phase 2 restructure |
| `components/ProjectsClient.tsx` | Project dashboard | Add entry path selector here |
| `app/wizard/[projectId]/upload/page.tsx` | Ingestion page | Integrate S3, fix live DB connector |
| `app/wizard/[projectId]/profile/page.tsx` | Data profiling | Already functional, add empty state |
| `app/wizard/[projectId]/requirements/page.tsx` | Requirements chat | Update prompts for no-data scenarios |
| `app/wizard/[projectId]/bus-matrix/page.tsx` | Bus Matrix editor | Add empty state, manual creation |
| `app/wizard/[projectId]/review/page.tsx` | Schema editor | Star layout, cardinality, export |
| `app/wizard/[projectId]/export/page.tsx` | Code gen output | Merge deploy action here |
| `app/wizard/[projectId]/deploy/page.tsx` | Deployment | Downgrade to action, not full page |
| `prisma/schema.prisma` | Database schema | Migrate to PostgreSQL |
| `lib/bedrock.ts` | AI client | No changes needed |
| `lib/prompts.ts` | AI prompts | Update for requirements-first mode |
| `lib/aws.ts` | AWS config | Add S3 and RDS clients |