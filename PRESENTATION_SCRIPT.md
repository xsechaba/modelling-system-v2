# Presentation Script — Automated Data Modelling Agent
> Use this as your speaking guide. Each section is marked with the slide it belongs to.
> Text in *italics* is a cue or reminder to yourself — don't read it out loud.
> Keep a natural, conversational tone. You don't need to say every word on this page.

---

## PART 1 — SLIDES SECTION
*This part is for the first few minutes where you walk through slides. Aim for 7–10 minutes total.*

---

### [SLIDE 1 — Title Slide]
**What to say:**

"Good [morning / afternoon] everyone. Today I'm going to walk you through a project I've been working on — an AI-powered data modelling agent. By the end of this, you'll understand the problem it solves, how it works, and you'll actually get to see it in action."

---

### [SLIDE 2 — The Problem]
**What to say:**

"Let me start with the problem. When a business wants to analyse its data — whether that's sales, operations, finance — someone first has to design what's called a data model. Think of a data model like a blueprint for a house. Before you can build anything, an architect has to draw up exactly where every room goes, how the rooms connect, what the pipes and wires look like. In data, that's what a data modeller or a data architect does.

The problem is: this process is slow, expensive, and requires very specific expertise. A skilled data modeller typically takes days or even weeks just to get from a business conversation to a usable schema. You need someone who understands the business, understands the data, AND understands the technical standards. That's a rare combination — and a costly one.

And in a consulting context like ours, we do this repeatedly for client after client."

---

### [SLIDE 3 — The Big Idea]
**What to say:**

"So the question we asked was: what if you could compress that entire process — from raw data and business conversations, all the way to a deployable database schema — into a single guided session, powered by AI?

That's exactly what this tool does. It's an end-to-end intelligent wizard that takes you from 'here is my data and here are my business requirements' to 'here are your tables, here is your SQL code, and here is your deployed database' — all in one place, without needing deep technical knowledge to drive it."

---

### [SLIDE 4 — What is a Data Model? (For the non-technical people in the room)]
**What to say:**

"Before I go further, let me quickly explain what a data model actually is, for anyone who might not be familiar.

Imagine you run a retail store. You have sales happening every day. A data model is essentially the organised structure that lets you answer questions like: 'What was our best-selling product last month?' or 'Which region had the lowest revenue this quarter?'

Without that structure, your data is just a pile of raw spreadsheets. With it, you can slice and analyse your business any way you want. The most common type of data model used in analytics is called a Star Schema — and that's what this tool builds.

A star schema has two types of tables: Fact tables — which store the numbers, the events, the transactions — and Dimension tables — which store the context, like who, what, when, where. The fact table sits in the middle, and the dimensions connect to it like points on a star. Hence the name."

*[If you have a simple diagram on the slide, gesture to it here.]*

---

### [SLIDE 5 — How the Tool Works — Overview]
**What to say:**

"The tool is structured as an 8-step pipeline. Each step builds on the previous one. Let me walk you through them at a high level.

Think of it like building a house. You wouldn't start laying bricks before you've spoken to the client about what they want, reviewed the land, and drawn up the blueprints. This tool enforces that same discipline — but compresses it dramatically using AI."

---

### [SLIDE 6 — The 8 Steps]
*Walk through each step briefly. One or two sentences each. The full explanation comes in the demo.*

**What to say:**

"Step 1 — **Ingest your data.** You upload your raw files — CSVs, Excel spreadsheets, or connect directly to a database. This is just giving the system something to work with.

Step 2 — **Set your technical configuration.** You choose your naming conventions — how tables should be named, what prefixes to use. This sounds small, but in enterprise settings these standards matter enormously.

Step 3 — **Data Profiling.** The AI automatically scans your data and tells you what it found — column names, data types, patterns, anomalies. You don't do anything here — it's the system doing its homework.

Step 4 — **Business Requirements.** You have a conversation with an AI Business Analyst. You upload meeting notes or transcripts, or you just chat. The AI extracts your business questions and turns them into structured requirements. What do you want to measure? How do you want to cut it?

Step 5 — **Bus Matrix.** This is a standard data warehousing technique. The AI maps your requirements into a grid — your business processes on one side, your dimensions on the other. It's like a coverage map that shows exactly what your data model needs to support.

Step 6 — **Schema Editor.** The AI generates the actual physical tables and relationships — the blueprint. You see it as a visual diagram and can edit it before committing.

Step 7 — **Code Generation.** The finalised schema is turned into production-ready SQL and dbt code. Ready to download and deploy.

Step 8 — **Deploy.** You connect the tool to your PostgreSQL database and hit deploy. The tables are created live. Done."

---

### [SLIDE 7 — Key Design Considerations]
**What to say:**

"A few things we had to think carefully about when building this.

**First: AI accuracy.** The AI is powerful, but it doesn't know your business. So the system is designed to always give the human the final say. At every step — the bus matrix, the schema, the column names — you can review and override. The AI proposes, you approve.

**Second: Context continuity.** A data model isn't designed in one shot. There are requirements from meetings, data from systems, naming conventions from IT, and business logic from stakeholders. The system stores all of that context and passes it through every step, so nothing gets lost.

**Third: Real output.** This isn't a report or a recommendation — it produces actual deployable artefacts. SQL DDL scripts, dbt models, and live database deployment. The output is immediately usable by an engineering team.

**Fourth: Non-technical usability.** A business analyst or a consultant who isn't a data engineer should be able to use this. The terminology is explained, the steps are guided, and the AI does the heavy lifting."

---

### [SLIDE 8 — Technology Stack (brief, don't dwell)]
**What to say:**

"Under the hood: the application is built on Next.js, a modern web framework. The AI is powered by Amazon Bedrock, specifically Claude 3 Sonnet from Anthropic — one of the leading large language models available today. Data is persisted in a SQLite database during development, and the tool connects to PostgreSQL for the deployment step. The whole thing can be hosted on an EC2 instance in AWS.

I won't go too deep into the tech — what matters is that it's all cloud-native, it's scalable, and it runs in your browser."

---

### [SLIDE 9 — Transition to Demo]
**What to say:**

"Alright — enough slides. Let me actually show you how this works. I'm going to walk through the entire pipeline from start to finish, so you can see what each step looks and feels like in practice."

*[Switch to the browser / app]*

---

---

## PART 2 — LIVE DEMO SCRIPT
*This section is your guide for the demo walkthrough. Each step has talking points. Speak naturally — don't read verbatim. Keep the energy up.*

*Before you start: make sure you have a project already set up with data uploaded and profiled. You don't need to demo every step from cold — you can skip to steps or have data pre-loaded.*

---

### DEMO STEP 1 — Show the Dashboard / Project List
**What to say:**

"So when you log into the tool, you land here — your project dashboard. You can have multiple projects on the go. Each one tracks its own progress. You can see here the pipeline steps as a progress bar — how far along each project is.

I've already created a project with some sample data. Let me open it."

---

### DEMO STEP 2 — Data Ingestion Page
**What to say:**

"This is the ingestion page. You can upload a CSV, Excel file, or connect directly to a source database. For this demo I've already uploaded a retail sales dataset — you can see it listed here.

Once uploaded, the tool kicks off profiling automatically."

---

### DEMO STEP 3 — Data Profiling Page
**What to say:**

"This is the profiling page. The AI has scanned the data and is giving us a structured summary. You can see things like: how many rows, what columns exist, data types, and the number of unique values per column.

On the right here is the AI's interpretation — it's not just showing you stats, it's explaining what the data likely represents. It's already spotted that there are date columns, customer IDs, product codes, and transaction amounts. That context flows forward into everything that comes next."

---

### DEMO STEP 4 — Technical Configuration Page
**What to say:**

"Before we go further, we can set our naming conventions. This page has presets — Kimball Standard is the most commonly used approach in enterprise data warehousing. You can also customise: fact table prefix, dimension table prefix, key naming style, and whether to include SCD Type 2 columns for tracking history.

We'll leave it on the Kimball preset and move on."

---

### DEMO STEP 5 — Business Requirements Page
**What to say:**

"Now here's where it gets interesting. This is the Business Requirements page — and it's essentially a conversation with an AI Business Analyst.

You can type your questions in natural language, or — and this is the really powerful part — you can upload a meeting transcript or notes from a client session, and the AI will extract the requirements for you.

Watch what happens when I upload this transcript."

*[Upload the transcript / show the extraction]*

"See how it's taken the conversation and turned it into structured requirements? Each one has a name, a description, a type — KPI, dimension, process — and a status. These get saved as 'banked requirements' that the rest of the pipeline is built on.

We can also just chat here — if I type something like 'I also want to track returns by product category', it adds that as a new requirement instantly."

---

### DEMO STEP 6 — Bus Matrix Page
**What to say:**

"Once requirements are confirmed, we move to the Bus Matrix. This is a standard technique from the Kimball data warehousing methodology — it's essentially a checklist that maps every business process to every dimension it needs.

If I click Generate via AI, the system reads all the banked requirements and automatically builds this grid.

Here you can see the processes — like Sales Transactions, Returns — down the side. And the dimensions — Date, Customer, Product, Store — across the top. Each tick means 'this process uses this dimension.'

I can manually adjust these ticks if something doesn't look right. Once I'm happy, I move forward."

---

### DEMO STEP 7 — Schema Editor Page
**What to say:**

"This is where the magic happens. The AI takes the bus matrix and generates the actual physical data model — the tables, columns, primary keys, foreign keys, and relationships.

You're looking at it as an ERD — an Entity Relationship Diagram. The fact tables are in the middle. The dimension tables branch off them. Each table shows its columns.

I can click on any table to edit it — rename columns, add columns, change types. I can also add entirely new tables if needed. This gives you full control before anything is locked in."

---

### DEMO STEP 8 — Code Generation Page
**What to say:**

"Once the schema is approved, we generate the code. The tool produces two things: raw SQL DDL — the CREATE TABLE statements — and dbt models, which is the modern standard for data transformation in warehouses like Snowflake, BigQuery, and Redshift.

You can download all of this and hand it directly to an engineering team. It's production-ready."

---

### DEMO STEP 9 — Deploy Page
**What to say:**

"And finally — deploy. You fill in your PostgreSQL connection details — host, port, database name, credentials — and you can preview the exact SQL that's about to run. You can see every CREATE TABLE and ALTER TABLE statement before anything touches the database.

Hit deploy, and watch the console. It connects, runs the statements one by one, and logs everything — green ticks for success, red if something fails.

The tables now exist in your target database. End to end — from raw data to a live schema."

---

---

## PART 3 — CLOSING

### [Back to slides — Final Slide]
**What to say:**

"So to wrap up — what we've built here is a tool that compresses what used to be a days-long, expert-heavy process into a guided, AI-assisted session that any analyst or consultant can drive.

The value isn't just the speed. It's the consistency, the documentation trail, and the fact that the output is immediately usable. Every step produces an artefact — requirements, a bus matrix, a schema diagram, SQL code — all traceable back to the business conversation that started the whole thing.

For Deloitte specifically, this has potential as an accelerator — something that could be offered as part of an analytics engagement to dramatically reduce the time from discovery to delivery.

I'm happy to take any questions."

---

## QUICK REFERENCE — Analogies to Use
*Use these if you feel the audience needs a simpler explanation of a concept.*

| Concept | Simple Analogy |
|---|---|
| Data Model | Blueprint for a house — the plan before you build |
| Star Schema | A star: fact in the middle, dimensions as the points |
| Fact Table | The transaction record — what happened, when, how much |
| Dimension Table | The context — who, where, which product, which store |
| Bus Matrix | A train route map — shows which lines serve which stations |
| Schema Generation | An architect drawing the rooms and connections from the brief |
| dbt Models | Recipes for how to cook the raw data into something useful |
| Deploy | Turning the blueprint into an actual built room — real, live tables |

---

## TIMING GUIDE
| Section | Suggested Time |
|---|---|
| Slides (Part 1) | 8–10 minutes |
| Demo walkthrough (Part 2) | 10–15 minutes |
| Closing + Q&A | 5 minutes |
| **Total** | **~25–30 minutes** |
