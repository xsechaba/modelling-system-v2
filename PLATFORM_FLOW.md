# DimWiz — How It All Works

> This document explains the full platform flow — what happens at each stage, how the AI works, what it receives, what it produces, and how each stage feeds into the next.
> Written to be understood without a data engineering background.
> A technical reference section is included at the bottom for developers.

---

## What is DimWiz?

DimWiz takes your raw business data and your business requirements, and turns them into a ready-to-deploy database model — automatically. It guides you through 8 stages. Each stage builds on the last. By the end, real tables exist in a real database.

---

## The 8 Stages at a Glance

```
1. Ingest Data
      ↓
2. Technical Configuration
      ↓
3. Data Profiling
      ↓
4. Business Requirements
      ↓
5. Bus Matrix
      ↓
6. Schema Editor
      ↓
7. Code Generation
      ↓
8. Deploy
```

Everything you do in one stage is remembered and passed forward. Nothing is lost between steps.

---

## How the Memory Works

Think of the project as a notebook that every stage reads from and writes to. When profiling finds that a column is a date, that gets written down. When requirements say "I want to track sales by region", that gets written down. When the bus matrix is generated, it reads those notes. The schema reads the bus matrix notes. The code reads the schema notes. Each stage is smarter because of everything that came before it.

Technically: all of this is stored as a single JSON object in the database — one "state" blob per project. Every API call reads it and adds to it.

---

---

## Stage 1 — Ingest Data

### What is this stage?
You give the platform your raw data. This is the starting point — without data, nothing else can happen.

### What can you upload?
- **CSV or Excel files** — e.g. `sales_transactions.csv`, `products.csv`
- **Database connection** — connect directly to a PostgreSQL database and pick which tables to import
- **Documents** — PDFs, Word files, images of dashboards or reports (used later in Requirements)

### What happens when you click "Run Profiler"?
The profiler scans your data automatically. **No AI is involved here** — it uses fixed rules, like a very thorough spreadsheet formula. For every column in every file, it works out:

| What it checks | How it decides |
|---|---|
| What type of data is this? | Looks at the column name and values — e.g. "order_date" → date, "customer_id" → unique identifier, "amount" → number |
| How many unique values? | Counts distinct values — high uniqueness = probably an ID or key |
| How many missing values? | Counts blanks and nulls — flags if more than 5% are missing |
| What are the most common values? | Top 10 by frequency — useful for categories like "product_type" |
| What is the range? | Min, max, average for numeric columns |
| Do columns across files match up? | Looks for matching column names across files — e.g. `customer_id` in both files → they can be joined |

### What do you see on screen?
Two panels appear:

1. **Key Callouts** — a highlighted list of the most important findings. Things like: "This column has 12% missing values", "These two files can be joined on customer_id", "This looks like a surrogate key"
2. **Full column-by-column breakdown** — every file, every column, all the stats

### What does "rules-based" mean?
It means no AI is used here. The system follows a fixed set of logic: *if the column name contains "date", it is a date column. If the column has more than 95% unique values and the name contains "id", it is probably a key.* These rules are the same every time — fast, consistent, and explainable.

### What gets saved?
- The uploaded file data
- The full profiling results (all the stats)

These are carried forward to every stage that follows.

---

---

## Stage 2 — Technical Configuration

### What is this stage?
Before the AI builds anything, you tell it the rules it must follow when naming things. This stage is about setting your house standards.

### Why is this necessary?
When the AI creates a database table, it has to give it a name. Without instructions, it might call a table `sales` or `Sales_Table` or `FACT_SALES` — inconsistent, unpredictable, and likely clashing with your company's naming conventions. This stage locks in your conventions **before** any table is created. Everything downstream — the schema, the SQL code, the deployed tables — will follow these rules.

### What can you configure?

| Setting | What it does | Example |
|---|---|---|
| Fact table prefix | Added to the front of every fact table name | `fct_` → `fct_sales` |
| Dimension table prefix | Added to the front of every dimension table name | `dim_` → `dim_customer` |
| Key suffix | Added to the end of every primary/foreign key column | `_key` → `customer_key` |
| Surrogate key type | What type the system-generated ID column should be | Integer (1, 2, 3...) or UUID |
| Include natural keys | Whether to keep the original business ID alongside the system ID | `customer_id` alongside `customer_key` |
| Column naming style | How column names are formatted | `snake_case` → `order_date` |
| SCD Type 2 | Whether dimension tables should track historical changes | Adds `effective_date`, `expiry_date`, `is_current` columns |

### Presets
Three presets are available so you don't have to configure manually:
- **Kimball Standard** — the most widely used convention in enterprise data warehousing
- **Modern Analytics** — lighter, more flexible naming
- **Enterprise DWH** — stricter, more verbose naming

### What gets saved?
The configuration is stored in the project state and injected into the AI’s instructions when the schema is generated — so it follows your rules automatically, without you having to repeat them.

---

---

## Stage 3 — Data Profiling

### What is this stage?
The AI looks at the profiling stats from Stage 1 and explains what it found — in plain English. This is the first time AI is involved in the pipeline.

### What does the AI receive?
The full profiling output from Stage 1: all the column stats, unique counts, missing value rates, cross-file join candidates — as a JSON object.

### What does the AI produce?
A written interpretation. It reads the raw numbers and explains:
- **What the data is about** — e.g. "This appears to be an e-commerce order dataset with order-level and item-level granularity"
- **Which columns look like dimensions** — e.g. "customer_id, product_id, and store_id are good candidates for dimension table keys"
- **Which columns look like measures** — e.g. "unit_price and quantity are numeric measures that belong in a fact table"
- **Data quality risks** — e.g. "order_date has 3% nulls", "customer_id appears twice under different names in two files"
- **How the files connect** — e.g. "sales_transactions.csv and products.csv can be joined on product_id"
- **Modelling recommendations** — e.g. "Consider separating geography into its own dimension"

### What do you see on screen?
The page shows the key callout cards from Stage 1 alongside the AI's written interpretation.

### What gets saved?
The AI’s interpretation text. This is injected into the Business Analyst agent’s knowledge in Stage 4 — so before you say a word, the agent already understands your data.

---

---

## Stage 4 — Business Requirements

### What is this stage?
You tell the platform what the business actually needs to measure. This is the most important stage — everything that follows is built from what you define here.

### How does the conversation work?
You chat with an AI Business Analyst. It has already read:
- The profiling results from Stage 1
- The AI interpretation from Stage 3
- Any documents you uploaded in Stage 1

So when you start talking, it already knows what data you have. It asks smart questions like: *"What business events are important to you?" "What KPIs do your stakeholders ask for?" "Are there any filters that should always apply?"*

You answer in plain English. It extracts requirements from your answers.

### What does the AI actually do on every message?
Behind the scenes, every time you send a message, **two or three things happen simultaneously**:

**1. The BA Agent responds conversationally.**
It replies to your message. As it identifies requirements, it labels them clearly in its response — e.g. `PROCESS: Order Item Sales | Grain: one row per order line item`. These labels are intentional — they make requirements easy for the next process to read.

**2. An Extractor scans the whole conversation.**
A separate AI call reads the entire conversation history and extracts every requirement it can find — from both your messages and the agent’s responses. It outputs a clean list and merges it into the existing requirements panel. This runs silently on every turn — the requirements list updates automatically without you doing anything.

**3. If you say something like "remove that" or "rename it", a Modifier runs.**
A third AI call detects modification commands and applies them immediately — delete, rename, update — before anything else merges.

### What are the four types of requirements?

| Type | What it means | Example |
|---|---|---|
| **Process** | A business event — something that happens | "Order Item Sales" — a sale occurring |
| **Dimension** | Context for that event — who, what, when, where | "Customer", "Product", "Date", "Store" |
| **KPI** | A number you want to measure — must have a formula | "Total Revenue = SUM(unit_price × quantity)" |
| **Rule** | A filter or condition that always applies | "Exclude cancelled orders from all revenue KPIs" |

### Can you upload documents?
Yes — you can upload meeting transcripts or interview notes. The AI reads the document and extracts requirements from it directly, instead of you having to type everything out. This is particularly useful when you have existing discovery session recordings.

### What do you see on screen?
Three panels:
1. **Left — The chat** — your conversation with the BA agent
2. **Middle — Requirements list** — all requirements, filterable by type (Process, Dimension, KPI, Rule)
3. **Right — Detail panel** — click any requirement to see and edit its full details

### What is "Banking" requirements?
When you are happy with what has been extracted, you click **Bank Requirements**. This locks them in and marks Stage 4 as complete. The banked list is what the Bus Matrix will be built from.

### What gets saved?
- The full chat history
- The banked requirements list
- A timestamp of when requirements were last updated (used to detect if the bus matrix needs refreshing)

---

---

## Stage 5 — Bus Matrix

### What is this stage?
The AI maps your banked requirements into a grid: your business processes down the rows, your dimensions across the columns. Each tick means "this process uses this dimension."

### Why is this step needed?
It answers a critical question before building any tables: *which dimensions connect to which facts?*

A sales transaction uses Date, Customer, Product, and Store. A customer review might only use Date and Customer. Building this map first means the schema generator knows exactly which tables need to be linked together — and which don’t.

### What does the AI receive?
- The banked requirements list (all processes, dimensions, KPIs, rules)
- The profiling data (as additional context)
- A strict instruction: the list of processes is fixed — do not invent new ones, do not remove any

The last point is important. Without that constraint, the AI might add or rename processes that don't match the requirements, which would break coherence with everything upstream.

### What does the matrix look like?

|  | Date | Product | Customer | Store |
|--|------|---------|----------|-------|
| **Sales Transactions** | âœ“ | âœ“ | âœ“ | âœ“ |
| **Product Returns** | âœ“ | âœ“ | âœ“ | |
| **Customer Reviews** | âœ“ | | âœ“ | |

### Can you edit it?
Yes — manually tick or untick any cell, add a process row, or add a dimension column. The AI's output is a starting point, not a final answer.

### Staleness warning
If you go back to Stage 4 and update requirements after this matrix was generated, a yellow warning banner appears. It means the matrix may no longer reflect your current requirements. Click **Generate via AI** again to refresh it.

### What gets saved?
The full matrix (dimensions + rows with tick/cross values) plus a timestamp. The timestamp is used to detect if the schema needs refreshing later.

---

---

## Stage 6 — Schema Editor

### What is this stage?
The AI reads the bus matrix and generates the actual physical data model â€” the tables, columns, primary keys, foreign keys, and relationships. You see it as an interactive diagram.

### How does the AI know which tables to create?
The server converts every bus matrix row and column into a mandatory table name **before** calling the AI:

- Each business process row → one fact table, using the prefix from Stage 2 (e.g. "Sales Transactions" → `fct_sales_transactions`)
- Each dimension column → one dimension table (e.g. "Customer" → `dim_customer`)

The AI is then told: *"You must create exactly these tables with exactly these names. Do not add or remove any."* This is what keeps the schema locked to the bus matrix.

### How does the AI know what columns to put in each table?
It uses everything from previous stages:

- **Stage 1 (Profiling):** the actual column names from your data — e.g. `customer_id`, `order_date`, `unit_price`, `quantity`
- **Stage 3 (Interpretation):** which columns are likely measures vs. which are likely keys or attributes
- **Stage 4 (Requirements):** the KPI formulas — if a KPI is `SUM(unit_price × quantity)`, both columns must appear in the fact table
- **Stage 2 (Config):** naming conventions, key suffix, whether to add SCD Type 2 columns

### How does it know how tables connect?
Each dimension table gets a primary key (e.g. `customer_key`). The fact table gets a matching foreign key column (e.g. `customer_key`) for every dimension it ticks in the bus matrix. The tick in the bus matrix = a connecting line in the schema diagram.

### What do you see on screen?
An interactive ERD (Entity Relationship Diagram):
- **Fact tables** — green header — hold the measurements (numbers, transactions)
- **Dimension tables** — grey header — hold the context (who, what, when, where)
- **Lines between them** — the foreign key connections
- You can drag tables to reposition them
- Click any table to inspect and edit its columns in the right panel

### Can you change it?
Yes â€” rename tables or columns, add or remove columns, add custom tables, or chat with the AI in plain English (e.g. *"Add a discount_amount column to the sales fact table"*).

### Staleness warning
If you go back to Stage 5 and regenerate the bus matrix after this schema was generated, a yellow banner appears on this page. Click **AI Generate** to rebuild the schema from the updated matrix.

### What gets saved?
The full schema as a list of nodes (tables) and edges (relationships), plus a timestamp.

---

---

## Stage 7 — Code Generation

### What is this stage?
The finalised schema is converted into files that an engineering team can immediately use. No more manual writing of SQL.

### What gets generated?

| File | What it is |
|---|---|
| One `.sql` file per table | The SQL to create each table in a dbt project — e.g. `fct_sales_transactions.sql`, `dim_customer.sql` |
| `_marts__models.yml` | A dbt schema file — defines each column, its description, and data quality tests |
| `documentation.md` | A business-readable document: executive summary, KPI definitions with formulas, a data dictionary, and a column-level glossary |

### What does the AI do here?
It enriches the column descriptions. The raw schema knows column names and types. The AI adds human-readable descriptions — e.g. *"customer_key: Surrogate key joining to dim_customer. Represents the customer who placed the order."* It also uses the KPI formulas from Stage 4 to document exactly how each KPI is calculated.

### Is it regenerated every time?
No â€” only if the schema has changed since the last generation. If nothing changed, the previously generated files are returned instantly from cache.

### What do you see on screen?
A file explorer on the left, a code viewer on the right. Click any file to preview. Download everything as a ZIP.

---

---

## Stage 8 â€” Deploy

### What is this stage?
You connect to a real PostgreSQL database and create all the tables live. The blueprint becomes a real structure in a real database.

### What do you fill in?
Your PostgreSQL connection details — host, port, database name, schema, username, and password.

### What happens when you click Deploy?
1. The system reads the finalised schema from Stage 6
2. It generates DDL (Data Definition Language) SQL â€” `CREATE TABLE` statements for every table, plus `ALTER TABLE` statements that add the foreign key links between tables
3. It connects to your database
4. It executes every statement in the right order — dimension tables first, then fact tables (because fact tables reference dimension tables)
5. A live console shows the result of each statement — green tick for success, red cross if something fails

### Can you preview it before running?
Yes â€” there is a collapsible DDL preview panel showing every SQL statement before you execute anything.

### What gets saved?
A record of when the deployment happened and which connection target was used (the password is never stored).

---

---

## How Everything Connects — Summary

| Stage | What it produces | Who uses it next |
|---|---|---|
| 1. Ingest | Raw profiling stats (column names, types, patterns, gaps) | Stage 3 (AI reads them), Stage 4 (BA agent context) |
| 2. Config | Naming rules (prefixes, suffixes, key type) | Stage 6 (schema naming), Stage 7 (code generation) |
| 3. Profiling | AI's written interpretation of the data | Stage 4 (injected into the BA agent's knowledge before the first message) |
| 4. Requirements | Confirmed list of processes, dimensions, KPIs, rules | Stage 5 (bus matrix rows and columns), Stage 6 (column names and formulas) |
| 5. Bus Matrix | Grid mapping processes to dimensions | Stage 6 (mandatory table list and FK connections) |
| 6. Schema | Table names, column names, relationships | Stage 7 (code gen input), Stage 8 (deploy DDL) |
| 7. Code Gen | SQL files, dbt models, documentation | Stage 8 (optional) or direct handoff to engineers |
| 8. Deploy | Live tables in a PostgreSQL database | Done |

---

## Where the AI Is (and Isn't) Used

| Stage | AI involved? | What the AI does |
|---|---|---|
| 1. Ingest / Profile | **No — rules only** | Fixed logic determines column types, stats, and flags |
| 2. Config | **No** | You configure manually or pick a preset |
| 3. Profile Interpretation | **Yes — AI Call 1** | Reads the stats, writes a plain-English interpretation |
| 4. Requirements (per message) | **Yes — 2–3 parallel calls** | Converses with you, extracts requirements as a structured list, handles modifications |
| 5. Bus Matrix | **Yes — AI Call 2** | Builds the tick grid from your requirements |
| 6. Schema | **Yes — AI Call 3** | Builds tables and relationships from bus matrix + requirements + profiling + config |
| 6. Schema Chat | **Yes — on demand** | Applies plain-English edits to the schema in real time |
| 7. Code Generation | **Yes — AI Call 4** | Generates SQL/dbt files, enriches column descriptions |
| 8. Deploy | **No** | Executes pre-generated DDL against a real database — no AI needed |

---

## The Staleness System

Every time something is generated, a timestamp is saved. If you go back and change something upstream, the system compares timestamps:

- Requirements updated **after** the bus matrix was generated → ⚠ Warning on the Bus Matrix page
- Bus matrix updated **after** the schema was generated → ⚠ Warning on the Schema page
- Schema updated **after** code was generated → Code is regenerated automatically on next open

This means you can always go back and change something — the system will tell you what needs to be refreshed downstream.

---

## Common Questions

**Q: What if I change my requirements after generating the bus matrix?**
Go to the Bus Matrix page and click Generate via AI again. Then go to Schema and click AI Generate. The system will show a warning at each step telling you to regenerate.

**Q: What if the schema doesn't look right?**
Edit it directly on Stage 6 — rename, add, or remove columns, or chat with the AI to make changes. You don't need to regenerate everything from scratch.

**Q: What if the AI puts the wrong columns in a table?**
The AI uses your column names from the uploaded data and your KPI formulas as its primary input. If a column is missing, it usually means the KPI formula didn't reference it. Go back to Requirements and update the formula.

**Q: Does Deploy overwrite existing tables?**
No â€” it uses `CREATE TABLE`, which only creates new tables. If a table already exists, that statement will fail and show a red warning in the console. Existing data is not touched.

**Q: Is the conversation in Stage 4 remembered across sessions?**
Yes â€” the full chat history is saved in the project state. Every time you open the Requirements page, the previous conversation loads back in.

---

---

## Technical Pipeline Reference
> This section is for developers and QA. It documents exact routes, AI inputs/outputs, validation gates, and coherence mechanisms.

---

### Shared State Architecture

Every stage reads and writes to a single project state object (`ProjectState.stateData` — a JSON blob in the database). Each stage adds its own keys. Later stages read earlier stages' keys.

```json
{
  "uploadedFiles":          [...],
  "profileResults":         {...},
  "aiInterpretation":       "...",
  "technicalConfig":        {...},
  "chatHistory":            [...],
  "bankedRequirements":     [...],
  "requirementsUpdatedAt":  1716300000000,
  "busMatrix":              { "dimensions": [...], "matrix": [...] },
  "busMatrixGeneratedAt":   1716300000001,
  "schema":                 { "nodes": [...], "edges": [...] },
  "schemaChatHistory":      [...],
  "schemaGeneratedAt":      1716300000002,
  "generatedCode":          [...],
  "codeGeneratedAt":        1716300000003
}
```

---

### Stage 1 — Upload + Profile (deterministic, no AI)

**Route:** `/api/profile` (CSV) or `/api/profile-db` (database)
**Library:** `lib/profiler.ts`

The profiler runs rule-based analysis. For each column it computes:

| Stat | Method |
|---|---|
| Semantic type | `inferType()` — date patterns, UUID/hex ID detection, code/zip guard, numeric name hints, categorical name hints |
| Row count | Exact (full file) |
| Unique count | Sampled unique (first 50K rows) + actual unique (full file scan for files > 50K rows) |
| Missing % | Null / empty string ratio |
| Top values | Top 10 by frequency (categorical/boolean) |
| Min / Max / Mean | Numeric columns |
| Histogram bins | Numeric and date columns |
| Cross-file callouts | Composite key detection, dual-identity columns, deduplication needs |

**Saved to state:** `uploadedFiles`, `profileResults`

---

### Stage 2 — Technical Configuration

**Route:** `GET/PUT /api/projects/[id]/state`
**Interface:** `TechnicalConfig` in `lib/knowledge.ts`
**Default:** `DEFAULT_TECHNICAL_CONFIG` (Kimball Standard)

Fields: `factPrefix`, `dimPrefix`, `keySuffix`, `surrogateKeyStrategy` (`integer`|`uuid`|`hash`), `naturalKeyInclude`, `columnNamingStyle`, `stripSourcePrefixes`, `scdType2Enabled`.

**Saved to state:** `technicalConfig`

Injected as a `=== TECHNICAL CONFIGURATION ===` block into the schema generation system prompt.

---

### Stage 3 â€” Profile Interpretation (AI Call 1)

**Route:** `POST /api/projects/[id]/profile/interpret`
**Prompt:** `PROMPTS.PROFILE_INTERPRETER`
**Input:** Full `profileResults` JSON
**Output:** Structured narrative covering: KEY FINDINGS, JOIN KEY MAP, DIMENSION CANDIDATES, FACT TABLE MEASURES, DATA QUALITY RISKS, CROSS-FILE WARNINGS, MODELLING RECOMMENDATIONS

**Saved to state:** `aiInterpretation`

Injected into the BA agent system prompt on every requirements chat turn.

---

### Stage 4 — Requirements (2–3 parallel AI calls per message)

**Route:** `POST /api/projects/[id]/chat`

#### Call A — BA Interviewer (conversational)
```
Input:  PROMPTS.REQUIREMENTS_INTERVIEWER + profileResults + aiInterpretation + chat history
Output: Plain-English response with explicit requirement labels:
        PROCESS: [Name] | Grain: [description]
        KPI: [Name] | Formula: [SQL formula on one line]
        DIMENSION: [Name] | Key attributes: [columns]
        RULE: [Name] | Rule: [business rule]
```

#### Call B â€” Requirements Extractor (JSON-only, runs on EVERY turn)
```
Input:  PROMPTS.REQUIREMENTS_EXTRACTOR + recent chat history (document uploads: document text only)
Output: JSON array of BankedRequirement objects
```
Output is merged into `bankedRequirements` using `mergeRequirements()` — dedup by ID, exact name, and normalized name. For document uploads, only the document text is sent (not the full history) to avoid context overload.

#### Call C â€” Modification Handler (keyword-triggered only)
```
Triggers: message contains add / delete / remove / rename / update / change / modify
Input:  PROMPTS.REQUIREMENTS_MODIFIER + current bankedRequirements + user command
Output: JSON array of operations: { op: "delete"|"add"|"update", id?, data? }
```
Applied before the extraction merge, so deletions take effect immediately.

**Saved to state:** `chatHistory`, `bankedRequirements`, `requirementsUpdatedAt`

**Gate to Bus Matrix:** Requires at least one requirement of type `"process"`.

---

### Stage 5 — Bus Matrix (AI Call 2)

**Route:** `POST /api/projects/[id]/bus-matrix/generate`
**Prompt:** `PROMPTS.BUS_MATRIX_GENERATOR`

Anti-hallucination mechanism: explicit process list + count injected into prompt â€” Claude cannot add rows beyond this list.

**Output format:**
```json
{
  "dimensions": ["Date", "Order", "Customer", "Seller", "Geography"],
  "matrix": [
    { "process": "Order Item Sales",   "dims": [true, true, true, true, true] },
    { "process": "Payment Processing", "dims": [true, true, true, false, false] }
  ]
}
```

**Saved to state:** `busMatrix`, `busMatrixGeneratedAt`
**Staleness check:** `requirementsUpdatedAt > busMatrixGeneratedAt` → ⚠ warning

---

### Stage 6 — Schema / ERD (AI Call 3)

**Route:** `POST /api/projects/[id]/schema/generate`
**Prompt:** `PROMPTS.SCHEMA_GENERATOR`

#### The Coherence Enforcement Layer
Server converts bus matrix names to mandatory table names before calling Claude:

```javascript
const toSnakeCase = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
// "Order Item Sales" + factPrefix "fct_" → fct_order_item_sales
// "Geography"        + dimPrefix "dim_"  → dim_geography
```

Injected as mandatory constraints into the prompt:
```
=== BUS MATRIX — MANDATORY FACT TABLE NAMES (3 total) ===
  "Order Item Sales"  →  fct_order_item_sales
  ...
=== BUS MATRIX — MANDATORY DIMENSION TABLE NAMES (5 total) ===
  "Geography"  →  dim_geography
  ...
DO NOT rename, combine, or add tables beyond this list.
```

**What Claude receives:** Mandatory name mappings + `bankedRequirements` + `busMatrix` + `profileResults` + `technicalConfig` block

**Design rules enforced by prompt:**
- Atomic measures only in fact tables (no stored SUM/AVG/COUNT — KPIs at query time)
- Natural keys alongside surrogate keys
- SCD Type 2 only if `technicalConfig.scdType2Enabled`
- Date role-playing (separate FK columns for different date roles on the same fact)
- Composite grain keys on all fact tables

**Output:** JSON `{ nodes: [...], edges: [...] }` → converted to ReactFlow format

**Saved to state:** `schema`, `schemaGeneratedAt`
**Staleness check:** `busMatrixGeneratedAt > schemaGeneratedAt` → ⚠ warning

#### Schema Chat
`POST /api/projects/[id]/schema/chat` — converts ReactFlow schema back to Claude’s JSON format, sends with `PROMPTS.SCHEMA_CHAT`, parses updated schema + explanation, re-renders in ReactFlow.

---

### Stage 7 — Export / Code Generation (AI Call 4)

**Route:** `GET /api/projects/[id]/export`

**What gets generated:**
1. **dbt SQL models** — one `.sql` file per table, using `{{ source() }}` and `{{ config() }}` macros
2. **`_marts__models.yml`** — dbt schema file with column-level descriptions enriched by `PROMPTS.DOCUMENTATION_GENERATOR`
3. **`documentation.md`** — client-ready business documentation

**Cache logic:** If `codeGeneratedAt >= schemaGeneratedAt`, return cached files without calling Claude again.

---

### Stage 8 — Deploy

**Route:** `GET /api/projects/[id]/deploy` (preview DDL), `POST /api/projects/[id]/deploy` (execute)

GET returns DDL preview (all CREATE TABLE + ALTER TABLE statements), table counts, and previous deployment info.

POST: accepts `{host, port, database, user, password, schema}`, connects via `pg` client, executes DDL in FK-safe order (dims first, then facts), returns structured logs `{ table, status, message }[]`, updates `completedSteps` and `deployedAt` in state.

---

### Coherence Chain

```
requirementsUpdatedAt  ──→  busMatrixGeneratedAt  ──→  schemaGeneratedAt  ──→  codeGeneratedAt
        ↑                           ↑                          ↑
   set on every               set when "Generate              set when "AI
   requirements change        via AI" clicked                 Generate" clicked
```

If any upstream timestamp is newer than the downstream one, a ⚠ stale warning appears.

---

### What Can Go Wrong (and How It's Handled)

| Failure Mode | Where It Occurs | Fix Applied |
|---|---|---|
| BA agent outputs raw JSON blocks | Requirements chat | Server detects `---*REQUIREMENTS*---` variants, parses, applies to `bankedRequirements`, strips from display |
| Extractor returns empty list | Requirements | Requirements unchanged — "Re-extract All" button forces a fresh extraction pass |
| Bus matrix hallucinating extra processes | Bus Matrix | Explicit process list + count injected into prompt â€” Claude cannot add rows beyond the list |
| Schema table names don’t match bus matrix | Schema | Mandatory `process → fct_name` and `dimension → dim_name` mappings built server-side before Claude call |
| Stale schema after bus matrix edit | Schema | `busMatrixGeneratedAt > schemaGeneratedAt` → ⚠ warning |
| Stale bus matrix after requirements change | Bus Matrix | `requirementsUpdatedAt > busMatrixGeneratedAt` → ⚠ warning |
| Large transcript causes Bedrock timeout | Requirements | Document uploads send only document text to extractor (not full history); `maxDuration = 120` on route |
| Schema chat breaks FK coherence | Schema | `SCHEMA_CHAT` prompt enforces: new dimension edges must also add the FK column to the fact table |

---

*DimWiz — from raw data to a deployable dimensional model, guided by AI.*
