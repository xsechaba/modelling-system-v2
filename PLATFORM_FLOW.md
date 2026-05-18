# DimWiz — Platform Flow Guide

> Simple, step-by-step walkthrough of the entire platform.  
> Use this as a reference during demos and presentations.

---

## What is DimWiz?

DimWiz is an AI-assisted data modelling platform. You give it your raw business data, tell it what you want to measure, and it designs a proper dimensional data warehouse model for you — ready to hand off to an engineer. The whole process is guided, stage by stage.

---

## The Journey at a Glance

```
Homepage → Sign Up / Log In → Projects Dashboard
    → Create Project → Wizard (6 stages) → Export
```

The Wizard stages, in order:

```
1. Upload    →    2. Requirements    →    3. Bus Matrix
                                              ↓
                                        4. Schema Review
                                              ↓
                                          5. Export
```

---

## Stage-by-Stage Walkthrough

---

### Homepage

**What you see:** A landing page explaining what DimWiz does.

**What you do:** Click **Get Started** or **Log In**.

---

### Sign Up / Log In

**What you see:** A simple email + password form.

**What you do:**
- First time → Sign Up with your name, email, and password.
- Returning → Log In.

Once logged in, you land on the **Projects Dashboard**.

---

### Projects Dashboard

**What you see:** A list of all your projects (or empty if you're new). Each card shows the project name, when it was last updated, and how far along it is.

**What you do:**
- Click **New Project** to start a fresh modelling project.
- Click an existing project card to continue where you left off.

**Note:** Each project is a separate, independent modelling exercise. You might have one project per client or one per data domain.

---

### Inside a Project — The Wizard

When you open a project you enter the **Wizard**. This is a 6-stage guided workspace.

**Navigation:**
- The **top tab bar** shows all 6 stages. A green dot appears on a stage once you've completed it.
- The **left sidebar icons** are shortcuts: home (projects dashboard), upload stage, requirements stage, and export stage.
- You move forward by clicking the green **proceed** button at the top-right of each stage.

---

### Stage 1 — Upload & Profile

**Purpose:** Give the platform your raw data so it understands what you're working with.

**What you see:** Three tabs — CSV Upload, Database Connection, and Docs.

**Tab 1 — CSV Upload:**
1. Drag and drop your CSV files (or click to browse).
2. Multiple files are supported — e.g. a `sales_transactions.csv` and a `products.csv`.
3. Click **Run Profiler**.
4. The platform analyses every column: data types, missing values, unique counts, distributions.
5. Results appear as a profiling report with **Key Callouts** — flags like "this column has 8% missing values" or "this looks like a surrogate key".

**Tab 2 — Database Connection:**
1. Enter your PostgreSQL connection details (host, port, database name, user, password).
2. Click **Connect**.
3. A list of available tables appears — tick the ones you want to profile.
4. Click **Run Profiler** — same result as with CSVs.

**Tab 3 — Docs:**
- Upload supporting documents (PDFs, Word files, images of dashboards or specs).
- These are passed as context to the AI in the Requirements stage.

**When done:** Click **Proceed to Requirements** at the top right. The green dot appears on Stage 1.

---

### Stage 2 — Requirements

**Purpose:** Tell the platform what the business actually needs to measure. This is the most important stage — the quality of everything downstream depends on what you define here.

**What you see:** Three panels side by side.

---

#### The Three Panels Explained

**Panel 1 — AI Chat (left)**

This is a Business Analyst agent. It has already read your profiling data and any uploaded documents.

- You talk to it in plain English.
- It asks you questions: *"What business events do you need to track? What KPIs matter most?"*
- You answer. It extracts requirements from your answers.
- When it has enough, it shows a **requirements block** at the bottom of a message — a structured list it wants to "bank".
- You can also upload an image (e.g. a screenshot of a dashboard or report) and the agent will read it.

**Key tip:** The agent is looking for:
- **Business Processes** — *what events happen?* (e.g. a sale, a return, a delivery)
- **Dimensions** — *what context surrounds each event?* (e.g. product, customer, store, date)
- **KPIs** — *what do you measure?* (e.g. Total Revenue, Units Sold, Returns Rate) — every KPI must have a formula
- **Rules** — *what filters or conditions apply?* (e.g. "exclude cancelled orders from revenue")

---

**Panel 2 — Requirements Hierarchy (middle)**

This panel shows all the requirements that have been **banked** (confirmed and saved).

- At the top: filter tabs — **All**, **P** (Processes), **D** (Dimensions), **K** (KPIs), **R** (Rules).
- Each requirement shows its name, type badge, priority, and status.
- Click a requirement to select it and see its details in Panel 3.
- The **+ Add** button at the top lets you manually create a requirement without the agent.
- The **edit icon** on a selected requirement lets you modify any field inline.
- The **trash icon** deletes a requirement.

---

**Panel 3 — Detail / Edit (right)**

- Shows the full detail of whichever requirement is selected in Panel 2.
- In edit mode: fields for name, type, priority, description, and formula (for KPIs and Rules).
- Changes are saved when you click **Save**.

---

**The Flow Inside Requirements:**

```
Chat with agent  →  Agent proposes requirements
                 →  You see them in Panel 2
                 →  Click one to review in Panel 3
                 →  Edit if needed
                 →  When happy, click "Bank Requirements"
                 →  A review modal shows a summary
                 →  Confirm → proceed to Bus Matrix
```

**Bank Requirements** = locking in your requirements and passing them to the next stage.

**Note:** You can also go back and add more through the agent or the + Add button at any point before banking.

---

### Stage 3 — Bus Matrix

**Purpose:** Map your business processes (facts) to the dimensions that give them context. This becomes the blueprint for your data warehouse.

**What you see:** A grid table — rows are business processes, columns are dimensions, cells are ticked where they intersect.

**Example:**

|  | Date | Product | Customer | Store |
|--|------|---------|----------|-------|
| **Sales Transactions** | ✓ | ✓ | ✓ | ✓ |
| **Product Returns** | ✓ | ✓ | ✓ | |

**What you do:**
- Click **Generate via AI** — the platform reads your banked requirements and generates the matrix automatically.
- You can manually adjust: tick/untick cells, add processes (+Add Process), add dimensions (+Add Dimension).
- Click **Generate Schema** (top right) when happy.

**Staleness warning:** If you go back and update requirements after generating the matrix, a yellow banner appears telling you the matrix may be out of date. Click Generate via AI again to refresh.

---

### Stage 4 — Schema Review

**Purpose:** Review and refine the physical star schema — the actual table designs that will be built.

**What you see:** Two panels.

**Left — Visual ERD canvas:**
- Fact tables (green header) sit in the centre.
- Dimension tables (grey header) connect from the sides.
- Lines between them show the relationships (e.g. 1:M).
- You can drag nodes to reposition them.
- Buttons: **Re-layout** (resets positions), **Export PNG** (saves the diagram), **Add Custom Table**.

**Right — Inspector & AI Chat:**
- Click any table node to inspect its columns in the panel.
- **Add Col** button adds a new column to the selected table.
- The AI chat lets you modify the schema in plain English: *"Rename dim_store to dim_location"* or *"Add a discount_amount column to fact_sales"*.

**Toolbar buttons:**
- **Visual ERD / YAML Override** toggle — switch between the visual view and a dbt-compatible YAML view.
- **AI Generate** — regenerates the whole schema from the bus matrix.
- **Approve & Export** — locks the schema and moves to the Export stage.

**Staleness warning:** Same as Bus Matrix — if the bus matrix changes after schema generation, a yellow banner appears.

---

### Stage 5 — Export

**Purpose:** Generate all the deliverables — the actual files the engineering team needs.

**What you see:** A file explorer panel on the left, a code viewer on the right.

**What gets generated:**

| File | What it is |
|------|------------|
| `fact_sales.sql`, `dim_date.sql`, etc. | dbt model files — one per table. Ready to run in a dbt project. |
| `_marts__models.yml` | dbt schema file with column descriptions and data quality tests. |
| `documentation.md` | Full business documentation — executive summary, KPI definitions with formulas, data dictionary, requirements traceability, source-to-target mapping. |

**What you do:**
- Click any file in the left panel to preview it in the code viewer.
- Click **Copy** to copy the content.
- Click **Output ZIP** to download everything as a zip file.

---

## The Complete Flow in One View

```
1. Sign up / Log in
       ↓
2. Create a new project
       ↓
3. Upload your CSVs (or connect a database) → Run Profiler
       ↓
4. Chat with the BA Agent → Bank your Requirements
   - Processes (what events happen)
   - Dimensions (what context exists)
   - KPIs (what you measure, with formulas)
   - Rules (what filters apply)
       ↓
5. Generate the Bus Matrix → Adjust if needed
       ↓
6. Generate the Schema → Review the ERD → Adjust if needed
       ↓
7. Export → Download dbt SQL + YAML + Documentation
```

---

## Things Worth Noting

**The green dots** on the top tab bar are your progress indicators. They fill in the moment you complete a stage — no need to reload the page.

**Nothing is locked.** You can go back to any stage at any time using the top tabs. If you change something upstream (e.g. update requirements), a **yellow warning banner** will appear in the downstream stages to remind you to regenerate.

**The AI is context-aware.** At every stage, the AI has access to everything from previous stages — your profiling data, your requirements, your bus matrix. It uses all of this to make better suggestions.

**Multiple processes = multiple fact tables.** If your data has events like sales AND returns AND inventory movements, you should have one business process per event. The agent will suggest additional processes if it spots signals in the data (e.g. an `is_returned` column).

**The formula matters.** For every KPI, a formula is required (e.g. `SUM(sales_amount) WHERE status = 'delivered'`). Without it, the schema generator won't know which columns to create. The agent will ask if one is missing.

---

*DimWiz — from raw data to a deployable dimensional model, guided by AI.*
