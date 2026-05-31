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

"Good [morning / afternoon] everyone. My name is Sechaba Mohlabeng, and I'm part of the Agentic AI Fast Track programme here at Deloitte. Over the past three months, the programme has given us a deep dive into agentic AI engineering — how to design, build, and deploy AI systems that don't just answer questions, but actually take actions and drive workflows end to end.

This is the project I was assigned to work on as part of that programme. Today I'm going to walk you through what I built — an AI-powered data modelling system. By the end of this, you'll understand the problem it solves, how it works, and you'll actually get to see it in action."

---

### [SLIDE 2 — The Problem]
**What to say:**

"Let me start with the problem. When a business wants to analyse its data — whether that's sales, operations, finance — someone first has to design what's called a data model. Think of a data model like a blueprint for a house. Before you can build anything, an architect has to draw up exactly where every room goes, how the rooms connect, what the pipes and wires look like. In data, that's what a data modeller or a data architect does.

The problem is: this process is slow, expensive, and requires very specific expertise. A skilled data modeller typically takes days or even weeks just to get from a business conversation to a usable schema. You need someone who understands the business, understands the data, AND understands the technical standards. That's a rare combination — and a costly one.

And once a model has been built, it's very difficult to change. Business requirements evolve — new dimensions get added, new processes come in scope — but the model doesn't easily flex with them. It's not agile. You often end up going back to the drawing board, which is expensive.

And in a consulting context like ours, we do this repeatedly for client after client."

---

### [SLIDE 3 — The Big Idea]
**What to say:**

"So the question we asked was: what if you could compress that entire process — from raw data and business conversations, all the way to a deployable database schema — into a single guided session, powered by AI?

That's exactly what this tool does. You bring your raw data and your business questions — the tool walks you through every stage of the process, step by step, and at the end you have a complete, production-ready data model. Real tables. Real code. Deployed to a real database. And you don't need to be a data engineer to drive it."

---

### [SLIDE 4 — What is a Data Model? (For the non-technical people in the room)]
**What to say:**

"Before I go further, let me quickly explain what a data model actually is, for anyone who might not be familiar.

Imagine you run a retail store. You have sales happening every day. A data model is essentially the organised structure that lets you answer questions like: 'What was our best-selling product last month?' or 'Which region had the lowest revenue this quarter?'

Without that structure, your data is just a pile of raw spreadsheets. With it, you can slice and analyse your business any way you want. The most common type of data model used in analytics is called a Star Schema — and that's what this tool builds.

A star schema has two types of tables: Fact tables — which store the numbers, the events, the transactions — and Dimension tables — which store the context, like who, what, when, where. The fact table sits in the middle, and the dimensions connect to it like points on a star. Hence the name."

*[If you have a simple diagram on the slide, gesture to it here.]*

---

### [SLIDE 5 — The 8 Steps]
*One sentence per step — the detail comes in the demo.*

**What to say:**

"The tool has 8 guided steps, but they were designed to be modular and independent — so you can start wherever you are, whether you already have business context, raw data, or both. But at a high level:

Step 1 — **Ingest.** Upload your raw data files or connect directly to a source database.

Step 2 — **Configure.** Set your naming conventions and technical standards for the model.

Step 3 — **Profile.** The AI scans your data and summarises what it contains.

Step 4 — **Requirements.** You have a guided conversation with an AI Business Analyst to capture what you want to measure.

Step 5 — **Bus Matrix.** The AI maps your requirements into a grid of business processes and dimensions.

Step 6 — **Schema Editor.** Review and edit the AI-generated table structure and relationships.

Step 7 — **Code Generation.** Download production-ready SQL and dbt code from your approved schema.

Step 8 — **Deploy.** Connect to your database and deploy the tables live."

---

### [SLIDE 6 — Key Design Considerations]
**What to say:**

"Three quick design considerations shaped this tool: AI accuracy, context continuity, and human-in-the-loop control.

**First: AI Accuracy.** AI is powerful, but it doesn't know your business. So the system always proposes — and you always decide. You can review and override at every step, approve the business logic and mappings, and you always have the final say.

**Second: Context Continuity.** Great models come from connecting the right dots. The system preserves context end-to-end — your business conversations, data profiling insights, technical standards, and business rules all flow through every stage, nothing gets lost between steps.

**Third: Human-in-the-Loop.** This is a collaboration, not a black box. You guide it, AI accelerates it, and you own the outcome — guided by AI, validated by you, deployed with confidence."

---

### [SLIDE 7 — Transition to Demo]
**What to say:**

"Alright — enough slides. Let me actually show you how this works. I'm going to walk through the entire system from start to finish, so you can see what each step looks and feels like in practice."

*[Switch to the browser / app]*

---

---

## PART 2 — LIVE DEMO SCRIPT
*This section is your guide for the demo walkthrough. Each step has talking points. Speak naturally — don't read verbatim. Keep the energy up.*

*Before you start: make sure you have a project already set up with data uploaded and profiled. You don't need to demo every step from cold — you can skip to steps or have data pre-loaded.*

---

### DEMO STEP 1 — Homepage and Login
**What to say:**

"So this is the homepage — what greets you when you first arrive. It's a clean entry point. From here you hit Login, authenticate, and you're in."

---

### DEMO STEP 2 — Workspaces and Project Dashboard
**What to say:**

"Once logged in, you land on the Workspaces page. This is where all your projects live — past and present. You can pick up any existing session right from here.

Let me open this project so you can see the dashboard. The dashboard gives you a full picture of where you are in the process — every completed step is tracked, you can see the data quality score, how many files have been ingested, and a full activity log. If you're working in a team, your collaborators are listed here too. It's designed so that anyone coming into the project mid-way knows exactly where things stand."

---

### DEMO STEP 3 — Starting a New Project
**What to say:**

"If we were starting fresh, this is what that looks like. You give the project a name, set the access controls — so you can control who can view or contribute — and configure whether you hace data to start off the session with or maybe you have context of the business needs.

You can also connect a Git repository at this point, so that the code generated at the end gets pushed directly to your repo without any manual copying."

*[You don't need to demo the full new project flow — just show it briefly and move on.]*

---

### DEMO STEP 4 — Data Ingestion
**What to say:**

"Alright — here's where the actual work starts. This is the Ingestion page. You have two options: upload static files like CSVs or spreadsheets, or connect directly to a live database if the data is already sitting somewhere.

I've already uploaded the dataset for this demo. You can see the files listed here with their status showing as 'Ready' — that means they've been received and are ready to be profiled."

---

### DEMO STEP 5 — Data Profiling
**What to say:**

"Now we run profiling.

A couple of things to note on this page. First — the technical configuration page. Before the profiling results show up, you set your naming conventions here. You can choose a preset — Kimball Standard, for example — or configure it manually: fact table prefix, dimension prefix, key naming style. Another future purpose of this page is flexibility: users must be able to influence behavior even for rules/settings that are not yet explicitly built into the UI.

Once that's set and profiling completes, we can go to the profiling page. There's a summary tab with key callouts about your data — column types, row counts, missing values. There's a visual tab with charts for a quick visual overview. And then there's the Profiling Agent — this is where it gets interesting. The AI has run a script to scan, summarise, and actually interpret the data. It gives you key findings, a join key map showing how your files relate to each other, and a list of dimension candidates — essentially it's already started suggesting what the data model could look like."

---

### DEMO STEP 6 — Business Requirements
**What to say:**

"Next is the Requirements page — this is where the business context gets captured.

You can upload context files here — meeting transcripts, existing dashboards, any notes from client sessions. Watch what happens when I upload this interview transcript."

*[Upload the file and show the extraction]*

"See that — it's read the document and extracted a structured list of business requirements. Each one has a name, a description, a type — KPI, dimension, or business process — and a status. Everything starts as a draft.

You're not locked into what the AI produces. You can chat directly with it — ask why a particular requirement was added, challenge it, or ask it to refine something. You can also manually edit, add, or delete requirements yourself. Once you're happy with the list, you confirm them and they move into the 'banked' stage — locked in and ready to drive the next steps."

*[If time allows, add one requirement via chat to show the real-time update]*

---

### DEMO STEP 7 — Bus Matrix
**What to say:**

"With requirements banked, we move to the Bus Matrix. This is the Kimball methodology's way of mapping business processes to the dimensions they need — you get a clear grid showing what facts sit against what dimensions.

Rather than building it from scratch, I'll hit Generate via AI. The system reads everything we've banked and builds the matrix automatically. You can see the processes down the side and the dimensions across the top — each tick means that process uses that dimension.

I can add or remove dimensions directly in the table if something's missing or needs adjusting. Any changes I make here are immediately saved and will flow forward into the schema."

---

### DEMO STEP 8 — Schema Generation
**What to say:**

"Now we generate the schema. The system takes the bus matrix — the facts, the dimensions, the relationships — and builds the actual physical data model.

This is the ERD — the Entity Relationship Diagram. Fact tables in the centre, dimension tables branching off them, with the relationships drawn between them. Every table shows its columns, primary keys, and foreign keys.

I have two ways to modify this. I can work directly on the board — click any table to rename it, add or remove columns, delete a table entirely. Or I can use the AI chat on the right — I can type something like 'rename dim_order to dim_customer_orders' and it'll make the change for me. This is useful when you want to make several structural changes at once without clicking through each one manually.

Once the schema looks exactly right, I can export it as a PNG — useful for sharing with a client or a technical team. Then I hit Approve and Export."

---

### DEMO STEP 9 — Code Generation and Deployment
**What to say:**

"This step is Code Generation. The platform produces the complete SQL DDL — all the CREATE TABLE statements — along with dbt models and accompanying documentation.

From here I can copy the code, download everything as a ZIP, or deploy directly. I'll deploy to a local database so you can see it happen live."

*[Click Deploy, fill in the connection details, click Deploy DDL]*

"Watch the console — it's connecting, then running each statement one by one. Green ticks for tables created successfully. Once it's done, those tables physically exist in the database. End to end — from a raw dataset and a business conversation to a live, deployed star schema.

That's the full flow."

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
