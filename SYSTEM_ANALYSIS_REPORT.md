# System Analysis Report — Gold Standard Readiness & Pipeline Coherence
**Date:** 2026-05-21  
**Context:** Analysis of whether the dim-wiz platform can produce outputs matching the gold standard, handle requirements modifications without duplication, maintain cross-stage coherence, and support dynamic schema editing (including snowflake schemas). Evaluated against the meeting discussion of 2026-05-20.

---

## Table of Contents
1. [Requirements Page — Extraction, Modification & Deduplication](#1-requirements-page)
2. [Bus Matrix — Coherence with Requirements](#2-bus-matrix)
3. [Schema Generation — Matching Gold Standard](#3-schema-generation)
4. [Schema Chat Agent — Live Editing & Snowflake Support](#4-schema-chat-agent)
5. [Export / Code Generation — dbt SQL Output](#5-export--code-generation)
6. [Cross-Stage Coherence — End-to-End Pipeline](#6-cross-stage-coherence)
7. [Generalizability — Will This Work With Other Datasets?](#7-generalizability)
8. [Summary of Issues from 2026-05-20 Meeting — Current Status](#8-meeting-issues-status)
9. [Recommendations](#9-recommendations)

---

## 1. Requirements Page — Extraction, Modification & Deduplication {#1-requirements-page}

### What Works

**Automatic extraction on document upload:** When a user uploads a transcript or document, the system fires TWO parallel AI calls — one for the conversational BA response, and one dedicated extraction call using `REQUIREMENTS_EXTRACTOR`. The extraction runs automatically (`forceExtract: forceExtract || isDoc` — always true for document uploads). This means the user does NOT need to manually ask the agent to extract. **This matches the 2026-05-20 meeting ask.**

**Merge deduplication logic (`mergeRequirements`):** The `lib/requirements.ts` file implements a three-tier matching strategy to prevent duplicates:
1. **ID match** — `r.id === newReq.id`
2. **Exact name match** — `r.name === newReq.name`
3. **Normalized name match** — strips `dim_`, `fct_`, `fact_` prefixes, removes "dimension"/"fact"/"table" suffixes, collapses separators, compares within the same type. So "Date Dimension", "dim_date", and "Date" all resolve to the same normalized key.

When a match is found, the existing requirement is **updated in-place** while **preserving user-managed fields** (id and status). This means a "Finalized" requirement won't revert to "Draft" on re-extraction.

**Manual CRUD operations:**
- Users can **delete** individual requirements via `handleDeleteRequirement` (filters by id)
- Users can **edit** any requirement inline via `handleStartEdit` → `handleSaveEdit`
- Users can **add** new requirements manually via `handleAddRequirement`
- Users can **toggle finalize/draft** per item via `handleToggleFinalize`
- Users can **finalize all** via `handleFinalizeAll`
- There is a **search/filter** bar (`searchQuery`) that filters by name, description, and logic
- There are **tab filters** for all/process/dimension/kpi/rule

**Auto-save:** Requirements are auto-saved to the server on a 2-second debounce (`autoSaveTimer`). Changes are persisted without requiring a manual "Save" button.

### What Doesn't Work / Risks

**Chat-based deletion and addition are NOT supported.** The user asked: "Am I able to delete some things just chatting with the agent?" The answer is **no** — the BA agent (`REQUIREMENTS_INTERVIEWER` prompt) can only **add** or **update** requirements via the `---BANKED_REQUIREMENTS---` block. There is no mechanism for the agent to interpret "delete the Date dimension" as a delete operation. The extractor always returns a full set, and `mergeRequirements` only adds or updates — it never removes.

To delete, the user must use the UI trash icon. To add via chat, the user can describe a new requirement and the agent will include it in the next extraction. But **"remove requirement X"** via natural language will not work.

**Re-extraction risk — the "11 dimensions" problem from the meeting:** The `mergeRequirements` function normalizes names, but the normalization is only effective if Claude uses similar enough names across runs. If Claude outputs "Date" on run 1 and "Calendar Date Dimension" on run 2, `normalizeName` will produce:
- Run 1: `"date"` → `normalizeName("Date") = "dat"` (wait — actually: "date".replace prefixes/suffixes → "date".replace separators → "date")
- Run 2: `normalizeName("Calendar Date Dimension")` → lowered: "calendar date dimension" → strip "dimension": "calendar date " → collapse: "calendardate"

These do NOT match → Claude creates a duplicate. **The normalization is too aggressive on some patterns and too lenient on others.** It strips the word "dimension" but doesn't strip arbitrary adjectives. This means re-extraction CAN still produce duplicates if Claude rephrases creatively.

**Mitigation already present:** The matching is within the same `type`, which helps. A "Date" process won't collide with a "Date" dimension. But within the same type, creative rephrasing still causes duplicates.

**`forceExtract` is always true for every user message:** Looking at `handleSend`:
```typescript
const handleSend = () => {
    sendMessage(input, false, undefined, true);  // forceExtract = true
};
```
Every user chat message triggers a full extraction call, not just document uploads. This is resource-intensive (two Bedrock calls per message) but ensures requirements stay in sync. The risk is that casual conversational messages ("thank you", "ok") still trigger extraction, wasting tokens and potentially producing empty arrays that are harmless but inefficient.

### Gold Standard Comparison

The gold standard BRD defines:
- **3 processes** (Order Item Sales, Payment Processing, Customer Reviews)
- **6 dimensions** (Customer, Seller, Product, Order, Geography, Date)
- **25 KPIs** across 6 categories
- **16 business rules**

The `REQUIREMENTS_EXTRACTOR` prompt is well-tuned for this. It explicitly calls out:
- Payment tables with their own grain → separate process ✓
- Reviews at their own grain → separate process ✓
- Order lifecycle dimension ✓
- Geography role-playing ✓
- All 7 KPI categories (commercial, volume, fulfilment, failure, customer, seller, payment) ✓

**Verdict: The system SHOULD produce outputs close to gold standard for this dataset.** The prompts are highly specific and reference the exact patterns in the Olist data. The risk is Claude variability — some runs may miss the Date dimension (as happened in the 2026-05-20 demo).

---

## 2. Bus Matrix — Coherence with Requirements {#2-bus-matrix}

### What Works

**Explicit process and dimension lists are enforced:** The `bus-matrix/generate/route.ts` pre-extracts process and dimension names from `bankedRequirements` and passes them as explicit numbered lists to Claude:
```
=== EXPLICIT PROCESS LIST (3 total — each MUST become a row) ===
1. Order Item Sales
2. Payment Processing
3. Customer Reviews

=== EXPLICIT DIMENSION LIST (6 total — each MUST appear as a column) ===
1. Customer
2. Seller
...
```

The prompt says: "The number of rows MUST exactly equal the number of items in that list." This is a strong guardrail.

**Staleness detection works:** The bus-matrix page compares `requirementsBankedAt` vs `busMatrixGeneratedAt`. If requirements were modified after the bus matrix was generated, it shows a warning: "⚠ Requirements have been updated since this bus matrix was generated." The user can then click "Generate" to re-generate.

### What Doesn't Work / Risks

**One-shot generation — no user editing of the matrix itself.** The bus matrix is generated entirely by Claude and saved as-is. The user can only regenerate, not manually toggle individual cells. If Claude incorrectly marks a dimension as `false` for a process, the user has no way to fix it without regenerating the entire matrix.

**Process/dimension name mismatch:** If the user's banked requirements use names like "Order Item Sales" but the bus matrix prompt produces "Order Sales", the downstream schema generator may not correctly map processes. The explicit list injection mitigates this, but doesn't guarantee name consistency in the output.

### Gold Standard Comparison

The gold standard bus matrix has:
- 3 processes × 7 dimension columns (Date, Customers, Sellers, Products, Geography-customer, Geography-seller, Orders)
- Clear true/false mapping with footnotes about review attribution

The system's prompt instruction to list Geography once (not twice for roles) differs from the gold standard which separates customer/seller geography. However, the SCHEMA_GENERATOR prompt handles role-playing correctly via separate FK columns, so this difference is cosmetic at the bus matrix level.

**Verdict: Bus matrix generation should be close to gold standard**, given the explicit list injection. The main risk is if the user's requirements have naming issues that propagate.

---

## 3. Schema Generation — Matching Gold Standard {#3-schema-generation}

### What Works

**Comprehensive prompt engineering:** The `SCHEMA_GENERATOR` prompt includes:
- One fact table per process (explicit rule) ✓
- Atomic measures only — no pre-computed aggregates ✓
- Natural keys alongside surrogate keys ✓
- No SCD2 unless explicitly requested ✓
- Order lifecycle dimension with derived flags ✓
- Date role-playing with named FK columns (`order_purchase_date_key`, `order_approved_date_key`) ✓
- Role-playing geography (single dim, separate FK columns) ✓
- Fact table grain keys (composite keys like `order_id + order_item_id`) ✓
- Edge cardinality direction (M:1 from fact to dim) ✓
- Clean business-friendly column names (strip file prefixes) ✓

**The prompt even includes a complete example** showing `fct_order_items`, `fct_order_payments`, `fct_order_reviews`, `dim_date`, `dim_geography` with exact column definitions. This means for the Olist dataset, the output should closely match the gold standard.

**ReactFlow visualization:** The schema is rendered using ReactFlow with custom `factNode` and `dimNode` components. Facts are positioned in the center column, shared dimensions on the left, specific dimensions on the right. Edges have arrows and cardinality labels (`M:1`).

### What Doesn't Work / Risks

**Auto-layout is algorithmic, not perfect.** The layout engine sorts dims into "shared" (connected to 2+ facts) and "specific" (connected to 1 fact) and places them in columns. For 3 facts and 7 dims, this works reasonably well. For larger schemas, nodes may overlap.

**Edge rendering stores source/target inverted:** In the `schema/generate/route.ts` and `schema/chat/route.ts`, edges are stored with `source = e.target` and `target = e.source` (swapping Claude's output to match ReactFlow's convention where source=dim → target=fact for visual arrow direction). This is confusing in the code but functionally correct — the arrows point from dimension to fact.

### Gold Standard Comparison

The gold standard schema has:
- 3 fact tables: `fct_order_items`, `fct_order_payments`, `fct_order_reviews`
- 7 dimension tables: `dim_orders`, `dim_customers`, `dim_sellers`, `dim_products`, `dim_geography`, `dim_date`
- `dim_orders` with lifecycle timestamps and derived flags (is_multi_item, is_multi_seller, delivery_delay_days, etc.)
- Role-playing date keys on `fct_order_items` (purchase, approval)
- Role-playing geography via separate FK columns

The system's prompt example literally matches this structure. The gold standard's `dim_orders` has 15 columns including derived flags — Claude should produce something very similar given the prompt instructions about "derived flags: is_multi_item, is_multi_seller, is_late_delivery, delivery_delay_days."

**Verdict: Schema generation should produce output very close to gold standard for this dataset.** The prompt is essentially a specification document. Claude variability may produce minor differences (column order, exact type names), but the structure should match.

---

## 4. Schema Chat Agent — Live Editing & Snowflake Support {#4-schema-chat-agent}

### What Works

**Natural language schema modification:** The `SCHEMA_CHAT` prompt enables:
- Rename tables/columns ✓
- Add/delete tables/columns ✓
- Change data types ✓
- Add/remove relationships (edges) ✓
- Restructure the model ✓

**Snowflake schema support is explicitly coded:** The prompt states:
> "SNOWFLAKE SCHEMAS: Dimension-to-dimension edges ARE supported. If a user asks to extract attributes into a separate dimension (e.g. geography from customer), create the new dim table, add an edge from the parent dim to the new dim (source=parent dim, target=new dim, cardinality='M:1'), and add a FK column in the parent dim referencing the new dim. Do NOT add the extracted dimension's FK to fact tables — it is reached through the parent dimension."

**FK coherence safety net:** After Claude returns the modified schema, the `schema/chat/route.ts` runs a post-processing loop that checks every edge and ensures the appropriate FK column exists:
- Dim → Fact edge: adds `<dim_name>_key (FK)` to the fact table if missing
- Dim → Dim edge (snowflake): adds `<child_dim>_key (FK)` to the parent dim if missing

This is a critical safety net that catches cases where Claude forgets to add FK columns.

**ReactFlow handles dim-to-dim edges:** The `review/page.tsx` layout engine explicitly identifies `dimToDimEdges` and positions child dimensions near their parent dimension. The visual rendering supports arrows between dimensions, not just fact-to-dimension.

**Chat history is preserved:** `schemaChatHistory` is saved to state, so the user can have a multi-turn conversation with the schema agent. Each modification builds on the previous state.

### What Doesn't Work / Risks

**Claude must return the COMPLETE schema every time.** The prompt says "Always return the COMPLETE schema, not just the changed parts." For large schemas (10+ tables, 100+ columns), this is expensive and error-prone — Claude may accidentally drop columns or tables when reconstructing the full JSON. The larger the schema, the higher the risk of data loss on each chat turn.

**Column type parsing is fragile.** The `schema/chat/route.ts` parses column strings like `"order_id VARCHAR(32) (FK)"` using regex:
```typescript
const nameMatch = c.match(/^([\w_]+)/);
const typeMatch = c.match(/\(([\w\s,]+)\)/);
```
The type regex `\(([\w\s,]+)\)` matches the FIRST parenthesized group. If a column has both a type and a PK/FK marker like `order_key INT (PK)`, the regex matches `(INT)` not `(PK)`. But for `order_key (PK)` without a type, it matches `(PK)` as the type, which then gets filtered. This works but is brittle.

**Edge source/target swap confusion:** The schema chat route swaps source/target when sending to Claude AND when receiving back:
```typescript
// Sending to Claude:
edges: stateData.schema.edges.map((e: any) => ({
    source: e.target,  // swap
    target: e.source    // swap
}))
// Receiving from Claude:
edges.push({
    source: e.target,   // swap back
    target: e.source    // swap back
});
```
This double-swap works but is confusing and could easily break if modified.

**Location key NOT appearing in fact tables — the 2026-05-20 meeting issue:** When the user asked to add `dim_location` by splitting geography from `dim_customers`, the prompt correctly says to add an edge from `dim_customers → dim_location` (not fact → location). But the meeting noted that the location key was missing from relevant fact tables. This is **by design** per the prompt: "Do NOT add the extracted dimension's FK to fact tables — it is reached through the parent dimension." Whether this is correct depends on the modelling philosophy — some warehouses want direct FK access from facts to all dims, even in a snowflake.

**The FK coherence safety net only handles two cases:** Dim→Fact and Dim→Dim. It does NOT handle the case where a user adds a brand new dimension and expects it linked to specific fact tables without explicitly asking for the edges. Claude must produce the edges in its response; the safety net only adds FK columns for edges that exist, it doesn't create new edges.

### Gold Standard Comparison

The gold standard schema shows `dim_geography` linked to `dim_customers` (via customer zip) and `dim_sellers` (via seller zip) — both are dimension-to-dimension relationships. The system's prompt and code support this. However, the gold standard also shows `dim_geography` indirectly accessible from fact tables through these parent dimensions, which matches the "reached through the parent dimension" design.

**Verdict: Schema chat editing works and snowflake schemas are supported at both the prompt and code level.** The main risks are (a) Claude dropping data when returning the full schema on large models, and (b) the location key / FK coherence issue noted in the meeting. The system IS dynamically capable — it will produce both star and snowflake schemas based on user requests.

---

## 5. Export / Code Generation — dbt SQL Output {#5-export--code-generation}

### What Works

**SQL models generated for every table:** The export route iterates over `schema.nodes` and generates a dbt model for each table with:
- `{{ config(materialized='incremental', unique_key='...') }}` for facts
- `{{ config(materialized='table') }}` for dimensions
- A `source_data` CTE referencing `{{ source('raw_data', '<table>_src') }}`
- Column selection from the CTE

**schema.yml with AI-enriched descriptions:** The route calls `DOCUMENTATION_GENERATOR` to produce an executive summary and column-level business descriptions. These are injected into the schema.yml file.

**Cache check:** If the schema hasn't changed since the last generation (`codeGeneratedAt >= schemaGeneratedAt`), the cached code is returned without calling Claude again.

### What Doesn't Work / Risks

**SQL models are boilerplate, NOT gold standard quality.** The generated SQL is a simple `SELECT * FROM source` pattern. It does not include:
- Staging layer with type casting (the gold standard has `CAST(price AS DECIMAL(10,2))`)
- Intermediate models (the gold standard has `int_order_enriched.sql` with derived flags)
- Proper join logic (e.g., joining order items with orders to get customer_id)
- Date dimension generation SQL (the gold standard creates a date spine)
- Deduplication logic for geography (the gold standard aggregates to centroid per zip)
- Category translation joins (the gold standard joins Portuguese → English)

The gold standard dbt project has a `staging/`, `intermediate/`, and `marts/` layer structure. The system produces only flat `<table>.sql` files without layering.

**No `sources.yml` generated.** The gold standard includes a `schema.yml` with source definitions. The system generates model descriptions but not source mappings.

### Gold Standard Comparison

The gold standard dbt SQL has 19 files across 3 layers with sophisticated transformation logic. The system produces ~10 flat SQL files with `SELECT *` boilerplate. **This is the widest gap between the system and the gold standard.**

**Verdict: Export/code generation is functional but produces template-level SQL, not production-quality dbt models.** The gap is significant. To match the gold standard, the system would need to:
1. Generate staging models with type casting
2. Generate intermediate models with join/enrichment logic
3. Generate mart models with proper source references
4. Include a date spine generator
5. Include deduplication and aggregation logic

---

## 6. Cross-Stage Coherence — End-to-End Pipeline {#6-cross-stage-coherence}

### What Works

**Requirements → Bus Matrix coherence:** The bus matrix generator receives the explicit process and dimension lists from requirements and is instructed to use them 1:1. If requirements have 3 processes and 6 dimensions, the bus matrix will have 3 rows and 6 columns.

**Bus Matrix → Schema coherence:** The schema generator receives the bus matrix, requirements, and profiling data. The prompt says "The number of fact tables MUST equal the number of business processes in the bus matrix." This enforces structural coherence.

**Requirements → Schema coherence:** The schema generator also receives `bankedRequirements` with KPI formulas. The prompt says to include "the raw source columns that the KPI formulas reference." If a KPI says `SUM(price)`, the fact table should have a `price` column.

**Staleness detection:** The bus matrix page detects when requirements have been updated after the matrix was generated (`requirementsBankedAt > busMatrixGeneratedAt`). The export route detects when the schema has changed since code was generated (`schemaGeneratedAt > codeGeneratedAt`).

### What Doesn't Work / Risks

**No back-propagation of schema changes to requirements or bus matrix.** If the user modifies the schema via chat (e.g., adds a new `dim_location`), the requirements and bus matrix are NOT updated. The schema may now contain tables that don't exist in the requirements. There is no "schema changed since bus matrix was generated" warning.

**No coherence validation between stages.** The system does not check whether:
- Every process in requirements has a corresponding fact table in the schema
- Every dimension in requirements has a corresponding dimension table
- Every KPI's referenced columns exist in the schema
- The bus matrix's dimension flags match the actual edges in the schema

This is checked by the Playwright coherence tests (`tests/05-coherence.spec.ts`), but those tests currently fail because the test project has no AI-generated data.

**Chat history state isolation.** The requirements chat (`chatHistory`) and schema chat (`schemaChatHistory`) are separate. The schema agent has no awareness of what was discussed in the requirements chat, and vice versa. If the user tells the requirements agent "remove the Date dimension," the schema won't know.

### Gold Standard Comparison

The gold standard shows tight coherence:
- 3 processes in BRD → 3 rows in bus matrix → 3 fact tables in schema → 3 sets of dbt models
- 6 dimensions in BRD → 6 columns in bus matrix → 7 dim tables in schema (geography is role-playing)
- KPI formulas reference columns that exist in the fact tables
- Business rules are reflected in schema design (e.g., R05 multi-seller → is_multi_seller flag in dim_orders)

The system achieves this coherence through prompt engineering and data passing, not through structural validation. If Claude is consistent, the output will be coherent. If Claude drops a dimension or renames a process, coherence breaks silently.

**Verdict: Cross-stage coherence relies entirely on Claude's consistency across separate API calls.** There is no structural validation. For the Olist dataset with well-tuned prompts, this should work. For novel datasets, coherence gaps are likely.

---

## 7. Generalizability — Will This Work With Other Datasets? {#7-generalizability}

### Strengths

**The prompts are dataset-agnostic.** The `REQUIREMENTS_EXTRACTOR`, `BUS_MATRIX_GENERATOR`, and `SCHEMA_GENERATOR` prompts describe general Kimball methodology, not Olist-specific rules. The instructions about "one fact per process," "atomic measures only," "natural keys," etc. apply to any domain.

**The profiling context is dynamic.** Each API call includes the actual column statistics from the uploaded files. Claude sees real column names, types, cardinalities, and null rates.

**The example in the schema prompt is helpful but not constraining.** The prompt includes an example output showing Olist-style tables, but Claude should adapt to different domains. The example serves as a format guide, not a content constraint.

### Risks

**The prompt examples may anchor Claude to e-commerce patterns.** The schema generator prompt example shows `fct_order_items`, `fct_order_payments`, `dim_customers`, etc. When processing, say, a healthcare dataset, Claude might over-index on the example structure and try to force the data into order/payment patterns.

**Token limits with large datasets.** The system passes full profiling JSON as context. For datasets with many files or many columns, this context may exceed Claude's effective context window or become too noisy for Claude to process accurately. The profiling data is not summarized — it's raw JSON.

**No domain-specific prompt tuning mechanism.** The gold standard approach works because Sechaba compared outputs against a known-good target and tuned the prompts accordingly. For a new dataset, there is no mechanism to feed a gold standard and have the system auto-correct. Each new domain may need prompt adjustments.

**The "Technical Configuration Page" from the meeting is NOT implemented.** There is no way for users to specify:
- Table naming conventions (FCT_ vs FACT_ vs no prefix)
- Key naming conventions
- Surrogate key preferences
- Schema style preferences (star vs snowflake default)

These preferences are currently hardcoded in the prompts (e.g., `fct_` prefix, surrogate keys by default).

**Verdict: The system will produce reasonable outputs for any tabular dataset, but quality will vary.** The Olist dataset benefits from highly tuned prompts. A novel dataset will get a reasonable first pass, but may need multiple regeneration cycles to match a domain expert's expectations.

---

## 8. Meeting Issues Status — 2026-05-20 {#8-meeting-issues-status}

| # | Issue from Meeting | Current Status | Code Evidence |
|---|---|---|---|
| 1 | **Missing Date dimension** | ⚠️ Partially addressed | The `REQUIREMENTS_EXTRACTOR` prompt lists "Date" as an expected dimension. But extraction depends on Claude — no hardcoded guarantee. If Claude misses it, the user must manually add via UI. |
| 2 | **Re-extraction duplicates (11 dimensions)** | ✅ Addressed | `mergeRequirements()` deduplicates by id, exact name, and normalized name. Risk remains for creative rephrasing. |
| 3 | **"Unfinalize" button naming** | ❌ Not fixed | The toggle function (`handleToggleFinalize`) still uses `status === 'Finalized' ? 'Draft' : 'Finalized'`. The UI button text would need to be checked in the JSX (likely still says "Unfinalize"). |
| 4 | **"Extract to BRD" manual button** | ⚠️ Partially addressed | `forceExtract` is now sent as `true` on every message (not just documents). But the button may still exist in the UI. The extraction is now always triggered, making the button redundant. |
| 5 | **No progress indicator during processing** | ✅ Addressed | `thinkingPhase` state rotates through "Reading context...", "Analyzing requirements...", "Extracting structured items...", "Validating output..." every 3 seconds. |
| 6 | **Search capability for requirements** | ✅ Implemented | `searchQuery` state with filter across name, description, and logic fields. |
| 7 | **Bus Matrix shows only one process** | ✅ Addressed | Explicit process list injection forces Claude to produce one row per process. If requirements have 3 processes, the matrix will have 3 rows. |
| 8 | **Snowflake schema support** | ✅ Implemented | `SCHEMA_CHAT` prompt explicitly supports dim-to-dim edges. `review/page.tsx` layout handles `dimToDimEdges`. FK coherence safety net handles dim→dim FK columns. |
| 9 | **Location key not in fact tables after adding dim_location** | ⚠️ By design | The prompt says "Do NOT add the extracted dimension's FK to fact tables — it is reached through the parent dimension." This is a valid snowflake modelling choice but may not match user expectations. |
| 10 | **Schema chat loading indicator** | ❌ Not verified | The schema chat UI likely has a loading state but this needs UI verification. |
| 11 | **Technical configuration page** | ❌ Not implemented | No settings page for naming conventions, surrogate key preferences, etc. |
| 12 | **Playwright MCP testing** | ✅ Implemented | 104 Playwright tests across 6 spec files covering all pages, light mode, coherence, and break testing. |

---

## 9. Recommendations {#9-recommendations}

### Critical (blocks gold standard matching)

1. **Hardcode a Date dimension guarantee.** After extraction, if no dimension with a normalized name matching "date" exists, automatically inject one:
   ```typescript
   if (!result.some(r => r.type === 'dimension' && normalizeName(r.name) === 'date')) {
     result.push({ id: 'req-date-auto', name: 'Date', type: 'dimension', ... });
   }
   ```

2. **Improve export/code generation to produce layered dbt models.** The current `SELECT *` boilerplate is the largest gap vs gold standard. The code generator needs:
   - A staging layer with type casting
   - An intermediate layer with joins and derived columns
   - A marts layer with the final star schema tables
   - A date spine generator

3. **Add structural coherence validation.** After schema generation, check:
   - Every process in requirements → has a `fct_*` table in schema
   - Every dimension in requirements → has a `dim_*` table in schema
   - Every KPI's column references → exist in the schema
   - Every bus matrix cell marked `true` → has an edge in the schema
   Show validation results to the user as a checklist.

### Important (improves reliability)

4. **Support chat-based deletion of requirements.** Add a new prompt instruction that detects removal requests ("remove the Geography dimension", "delete KPI K15") and returns a special `---REMOVE_REQUIREMENTS---` block with IDs to delete. Parse this in the chat route and remove matching items.

5. **Add schema staleness detection.** When the schema is modified via chat, set a `schemaModifiedAt` timestamp. The bus matrix page should detect `schemaModifiedAt > busMatrixGeneratedAt` and warn the user (or vice versa). Currently only requirements→bus-matrix staleness is tracked.

6. **Implement the Technical Configuration page.** Allow users to configure naming conventions, surrogate key preferences, and schema style (star/snowflake default) during project setup. Inject these preferences into all downstream prompts.

7. **Rename "Unfinalize" to "Keep as Draft"** per the meeting feedback.

### Nice to Have

8. **Reduce token usage.** Only trigger extraction when Claude's response contains requirement-like content (use a lightweight classifier or keyword scan), not on every message.

9. **Schema size protection.** For schemas with 10+ tables, consider returning only the diff (changed nodes/edges) from the schema chat agent instead of the full schema, to reduce the risk of Claude dropping data.

10. **Add gold standard comparison tooling.** Allow users to upload a gold standard file and show a side-by-side diff of their system output vs the gold standard. This would make prompt tuning systematic rather than manual.

---

## Summary

| Area | Gold Standard Readiness | Key Gap |
|---|---|---|
| **Requirements Extraction** | 🟢 High | Date dimension not guaranteed; chat-based deletion not supported |
| **Requirements Deduplication** | 🟢 High | Creative rephrasing can still cause duplicates |
| **Requirements Modification (UI)** | 🟢 High | Edit, delete, add, finalize all work via UI |
| **Requirements Modification (Chat)** | 🟡 Medium | Can add/update via chat; cannot delete via chat |
| **Bus Matrix Generation** | 🟢 High | Explicit list injection ensures correct structure |
| **Bus Matrix ↔ Requirements Coherence** | 🟢 High | Staleness detection works |
| **Schema Generation** | 🟢 High | Prompt closely matches gold standard structure |
| **Schema Chat Editing** | 🟢 High | Natural language editing works; snowflake supported |
| **Schema ↔ Bus Matrix Coherence** | 🟡 Medium | No staleness detection for schema changes |
| **Export / dbt SQL** | 🔴 Low | Boilerplate `SELECT *` — no staging, joins, or type casting |
| **Cross-Dataset Generalizability** | 🟡 Medium | Works but no config page; prompt examples may anchor |
| **Overall Pipeline Coherence** | 🟡 Medium | Relies on Claude consistency; no structural validation |
