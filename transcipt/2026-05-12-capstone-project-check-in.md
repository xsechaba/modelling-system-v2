# Capstone Project Check-In - Requirements UI Overhaul, Data Handling Scope & Handover Logic

**Date:** 12 May 2026  
**Time:** 12:30 PM (Duration: 30 minutes 53 seconds)  
**Attendees:** Sechaba Mohlabeng (Development Lead), Neil Lategan (Product Owner)  
**Recording:** Capstone Project Check-In Automated Data Modeler-20260512_143007-Meeting Recording

---

## Executive Summary

This meeting focused on the latest implementation progress after the previous feedback session, especially the attempt to make the platform less linear and more modular. Sechaba demonstrated the updated flow, including the new option to start either with **business requirements first** or **data first**, and walked Neil through what is currently functional versus what is still incomplete.

The most important outcome of the meeting was that the **requirements section is now the highest-priority redesign area**. Neil indicated that GitHub integration should be paused for now, and that the next major effort should go into making the requirements workflow more structured, more reviewable, and more useful as an input into the Bus Matrix and downstream schema generation.

Key outcomes include:

1. **Modular Entry Path Introduced:** The platform now allows users to begin either with data or with business requirements/context first. This direction is aligned with the previous meeting’s request to reduce rigidity in the workflow.
2. **GitHub Integration Deprioritized:** Neil explicitly said GitHub can be paused for now so effort can be redirected toward more important capabilities.
3. **Profiling Scope Clarified:** Profiling is considered “good enough” for now if the platform can reliably handle clean CSV files. The immediate next technical target is to support a PostgreSQL database connection, not to over-invest further in profiling sophistication at this stage.
4. **S3 + Postgres Direction Confirmed:** Uploaded CSVs should eventually be stored in S3, and users should also be able to connect directly to a PostgreSQL database for profiling.
5. **Requirements UX Must Be Restructured:** The current requirements screen works functionally, but Neil wants it redesigned into a more structured business-requirements workflow inspired by the reference screenshots he shared. The current formulas panel was seen as weak, and the requirements output was not yet coherent enough to hand off properly to the Bus Matrix stage.
6. **Agent Roles Must Be Sharpened:** Neil stated that the first agent should behave like a **business analyst** that elicits and structures requirements, while the next stage should behave like a **data warehouse designer** that turns those banked requirements into a Bus Matrix and then a schema.
7. **Schema Editor Is Good Enough for Now:** The schema editor still has layout and usability issues, but Neil indicated that most of those can be treated as cosmetic for now, as long as the editor remains editable and has a usable YAML view. The fact/dimension layout issue remains a known irritation.
8. **New Test Data Direction:** The new dataset provided for future testing is the **Brazilian E-Commerce Public Dataset by Olist** on Kaggle, which contains around **100,000 orders** from **2016–2018** with multiple related datasets covering orders, payments, freight, customers, products, reviews, sellers, and geolocation.

---

## Detailed Discussion by Topic

### 1. New Entry Flow: Requirements First vs Data First

Sechaba began by showing the latest change implemented after the previous meeting: when a user creates a new project, the platform now asks whether the user wants to begin with **business requirements first** or whether the user already has **data**. If the user chooses the requirements-first path, the platform jumps directly into what was previously Step 3. If the user has data, the flow begins more traditionally from ingestion. This was Sechaba’s implementation of the modular-flow feedback previously discussed.

Neil acknowledged the addition positively, but very quickly deprioritized adjacent work such as GitHub integration. He explicitly said GitHub should be **paused for now** because other parts of the platform are more important to get right first. This was an important scope decision: the product should focus on the **core modelling flow** before spending more time on deployment-related integration.

### 2. Profiling Capability: Scope, Assumptions, and Next Technical Step

Neil asked Sechaba to slow down and explain, in very practical terms, what currently works and what does not work around data profiling. Sechaba explained that profiling works if the input data is of a certain quality and structure, but that it is still not sophisticated enough to robustly handle arbitrary or messy files. The current implementation works best with a **well-structured CSV**.

Neil then deliberately narrowed the requirement and said the system can, for now, **assume a clean CSV** without unusual characters. He asked whether that was good enough, and Sechaba confirmed that this assumption would make the current profiling implementation sufficient for the moment. Neil accepted that and said that profiling does not need more attention immediately.

The next technical focus, according to Neil, should not be more profiling sophistication, but rather the ability to **connect directly to a database**. He specifically said the system should be able to connect to a **PostgreSQL database**, which Sechaba linked back to the RDS/Postgres direction already being explored.

Neil also clarified the intended file/data model:
- users should be able to upload CSVs through the frontend,
- those CSVs should be stored in **S3**,
- and users should also be able to connect directly to a **Postgres database** and profile data there.

This means the system is expected to support **two data input paths**:
1. file-based ingestion via CSV uploads stored in S3,
2. direct database-based profiling via a Postgres connection.

### 3. Requirements Section: What Works vs What Is Weak

The requirements section became the main focus of the meeting. Sechaba explained that this stage can now:
- accept uploaded context material,
- read and react to that material,
- and extract requirements and KPI-related outputs.

To test this, Neil supplied a transcript/document and asked Sechaba to upload it into the requirements area. The platform successfully recognized the uploaded document and began summarizing its requirements. This confirmed that the upload interaction was functioning in React and that the requirements area could ingest supporting text-based content.

However, the meeting also made it clear that the **UI and output structure of this requirements stage are not yet good enough**. When Neil asked what appears on the left and what appears on the right, Sechaba explained:
- the **left side** currently shows the conversation and extracted requirements,
- the **right side** currently shows extracted KPI model formulas.

Neil’s reaction was that the formulas looked **weak**, even though he acknowledged that he had not read the source material in full. More importantly, he said that the UI needs to evolve from “chat + formula list” into something much more structured.

### 4. Requirements UI Redesign Inspired by the Reference Images

Neil shared reference images during the call and used them to explain how the requirements section should work conceptually. The images show a structured, multi-pane layout with:
- a **hierarchy panel** on the left,
- a **main explorer/editor** in the center,
- and a **detail/logic panel** on the right.

The first screenshot shows a “Knowledge Base Interactive Viewer” with a hierarchical structure on the left and detailed risk/control content on the right. The second screenshot shows a process hierarchy, a central process explorer, and a logic explorer. The third screenshot shows a tabular analytics/testing-style view. These images were not meant to be copied exactly, but they were meant to inspire a more structured way of presenting extracted requirements, their prioritization, and their downstream logic.

Neil explained that the requirements section should almost work like this:
- the uploaded material is first used to extract a **list of requirements**,
- the user can then interact with those requirements,
- requirements can be **reviewed, edited, deleted, or reprioritized**,
- and then once finalized, those requirements are “banked” and handed over to the next stage.

He suggested that instead of “Risk Hierarchy,” the left-hand panel could become a **Requirements Hierarchy**, where:
- each requirement is listed,
- the user can click on a requirement,
- and then use the center/right side to review or edit it.

The formulas were not rejected entirely. Neil said he still liked the formulas, but suggested they might fit better into a **logic explorer** or a more detailed secondary panel rather than being the main right-hand output as they are now.

### 5. Agent Role Split: Business Analyst First, Warehouse Designer Second

One of the most important conceptual clarifications in the meeting was how the AI stages should be divided.

Neil said that the **first agent** should be thought of as:
- a **business analyst**,
- or a combined **business + data analyst**,
- whose job is to extract, structure, and format the requirements like a business requirements document.

Then the **next agent / next stage** should be treated as:
- a **data warehouse designer**,
- whose job is to take the output of the requirements stage and turn it into:
  - a Bus Matrix,
  - and then a star schema.

This was a critical observation, because Neil felt the current handoff between requirements and Bus Matrix was not coherent enough. The issue was not just UI — it was that the **prompt/system role and the handover logic** needed to be sharpened.

### 6. Bus Matrix: Main Problem Is Handover and Lineage

Sechaba showed the Bus Matrix stage, which still supports:
- starting from scratch, or
- generating using AI based on available context.

Neil accepted that the Bus Matrix screen itself is functionally moving in the right direction, but said the key problem is **how the requirements output gets handed over** to it. He used examples from the extracted requirements (such as business processes and dimensions like location/branch and purchase-to-pay cycle time) and asked where those concepts appear in the Bus Matrix. His point was that the current transition between screens is too weak: the requirements screen is not yet producing a sufficiently clear, structured output that the Bus Matrix can reliably consume.

He clarified that what must be carried forward is not necessarily **all** raw context, but rather the **banked output** of the requirements stage. He described it metaphorically as if a business analyst had produced a stack of requirement papers and handed them over to the data warehouse builder. That is the level of handoff the platform should emulate.

This means that the current problem is:
- not just “the Bus Matrix prompt is wrong,”
- but “the requirements stage is not yet producing the right structured output for the next stage.”

### 7. Schema Editor: Good Enough for Now, Mostly Cosmetic Issues

The schema editor was shown again, including:
- the ability to export the visual as an image,
- a YAML view,
- and manual editing / regeneration behavior.

Sechaba explained that the fact/dimension visual arrangement still needs work, especially the desired structure where:
- fact tables sit in the center,
- and dimensions sit to the sides.

Neil responded that this issue continues to irritate him and will likely continue to come up until it is fixed, but he also said that for the moment it is **probably okay-ish** and that many of the remaining schema-view issues can be treated as **cosmetic** for now. He emphasized, however, that the key thing is that the schema remains **editable**, and that it has a usable **YAML view** that can be reused.

He also mentioned that other preferences, such as dark vs light theme, fall into the category of cosmetic refinements rather than immediate blockers.

The overall message was:
- the schema editor is not perfect,
- but it is acceptable enough for now,
- while the more urgent effort should go into the requirements stage and its handoff to the Bus Matrix.

### 8. Requirement Uploads Must Expand Beyond Text-Only Thinking

A notable moment in the meeting came when Neil tried to test whether the requirements upload could handle an **image**. Sechaba initially attempted to use the upload functionality and then realized the current implementation could not take in a picture. Sechaba explained that the upload thinking had so far mainly focused on text-based files.

Neil then stated that the platform **does need picture-upload capability** as well. After that, he changed the test and instead provided a transcript-like text file and asked Sechaba to save it as a Markdown file and upload that. That test worked, which confirmed that text-style document ingestion is currently supported, but it also surfaced a new requirement:

> the platform’s requirements/context upload should not be limited mentally or technically to text-only assumptions.

This is important because the platform is expected to work with:
- documents,
- specs,
- screenshots,
- and potentially other context artifacts in the future.

### 9. Prioritization Decision: Requirements UI Before Next Meeting

Toward the end of the call, Neil explicitly said that the **most important work before the next meeting** would likely come out of the requirements section. He said that this effort is now **more about UI and flow** than about deep backend changes in the immediate term.

He said that what needs to be done next is:
- get the requirements screens and flows right,
- make the output more structured and coherent,
- and make the handoff into the Bus Matrix clearer.

In other words, the next sprint of effort should prioritize:
1. improving the **requirements extraction UX**,
2. structuring and banking requirements properly,
3. and then letting the Bus Matrix consume that more reliably.

### 10. New Test Data to Use Going Forward

In addition to the transcript and image references, a new dataset was provided to be used as the **next main test dataset**: the **Brazilian E-Commerce Public Dataset by Olist** on Kaggle. According to the dataset description, it contains about **100,000 orders** from **2016 to 2018** and includes multiple related datasets with information about:
- order status,
- price,
- payment and freight performance,
- customer location,
- product attributes,
- customer reviews,
- and geolocation.

This dataset is useful because it is:
- real commercial data that has been anonymized,
- richer than a single simple CSV,
- and well suited for testing profiling, requirements extraction, dimensional modelling ideas, and eventually multi-table/schema generation.

It should therefore become the next main dataset used for validating:
- profiling behavior,
- requirement extraction quality,
- and schema generation realism.

---

## Action Items from Session

| Category | Action | Owner | Due | Priority |
|---|---|---|---|---|
| **Workflow** | Keep the new “requirements first vs data first” entry split, but pause lower-priority integrations while the core flow is stabilized. | Sechaba | Immediate | HIGH |
| **Prioritization** | Pause GitHub integration work for now and focus effort elsewhere. | Sechaba | Immediate | HIGH |
| **Data Handling** | Treat clean CSV support as good enough for now; do not over-invest more in profiling sophistication immediately. | Sechaba | Immediate | HIGH |
| **Data Handling** | Implement the next major input path: direct connection to a PostgreSQL database for profiling. | Sechaba | Next Sprint | HIGH |
| **Storage** | Ensure uploaded CSVs are stored in S3 as part of the intended file-handling model. | Sechaba | Next Sprint | HIGH |
| **Requirements UI** | Redesign the requirements section into a more structured, multi-pane requirements workflow inspired by the reference screenshots. | Sechaba | Before Next Meeting | HIGH |
| **Requirements UI** | Add support for reviewing, editing, deleting, and prioritizing extracted requirements. | Sechaba | Before Next Meeting | HIGH |
| **Requirements Logic** | Rework the system prompt / output of the requirements agent so it behaves like a business analyst producing a structured requirements document. | Sechaba | Before Next Meeting | HIGH |
| **Handover Logic** | Make the requirements stage produce a clear banked output that can be handed to the Bus Matrix stage. | Sechaba | Before Next Meeting | HIGH |
| **Bus Matrix** | Improve coherence between requirements outputs and the Bus Matrix inputs so business processes and dimensions flow through more clearly. | Sechaba | Next Iteration | HIGH |
| **Schema Editor** | Keep the schema editor editable and maintain a usable YAML view; treat theme/layout refinements as cosmetic for now. | Sechaba | Ongoing | MED |
| **Context Uploads** | Extend thinking and support around requirements uploads so the system can eventually handle images/screenshots as well as text-based documents. | Sechaba | Future Design | MED |
| **Testing Data** | Use the Olist Brazilian E-Commerce dataset as the next major test dataset for profiling and modelling validation. | Sechaba | Immediate | HIGH |

---

## Open Questions & Future Considerations

1. **Requirements Structure:** What is the best internal structure for “banked requirements” so they can be handed off cleanly to the Bus Matrix stage?
2. **Image Uploads:** How should the platform support image-based context in the requirements flow, and what should the system do with screenshots or visual documents after upload?
3. **Bus Matrix Coherence:** How should extracted business processes, dimensions, and KPI goals map more explicitly into the Bus Matrix so the flow becomes traceable?
4. **Schema Layout:** What is the easiest practical way to get to the desired “fact in the middle, dimensions on the side” layout without over-engineering the schema editor right now?
5. **Dataset Readiness:** How much preprocessing or structure adaptation will be needed before the Olist dataset can be used smoothly across profiling, requirements extraction, and modelling workflows?

---

## Summary & Next Steps

This meeting marked a shift away from general platform adjustments and toward a very specific near-term focus: **the requirements stage now needs the most work**. The modular entry path has now been introduced, and GitHub integration has been deprioritized so that attention can move to the parts of the system that most directly affect modelling quality.

The immediate goal is no longer to keep adding disconnected features. Instead, the next phase should concentrate on:
- refining the requirements workflow,
- making extracted requirements structured and editable,
- improving the handoff into the Bus Matrix,
- and then continuing with the next technical integrations such as Postgres DB connectivity and S3-backed file handling.

The newly provided Olist e-commerce dataset should become the primary new test dataset for validating the next stage of work because it offers a richer, more realistic set of tables and business signals than a simple flat CSV.

---

**Session Recorded:** 12 May 2026, 12:30 PM  
**Transcript Duration:** 30 minutes 53 seconds  
**Prepared By:** Sechaba Mohlabeng (Development Lead)  
**Source Material:** Meeting transcript, reference UI images shared in discussion, and new proposed test dataset from Kaggle

---
*End of Document*
