# Capstone Project Check-In - End-to-End Demo with Guest, UI Feedback & Prompt Validation Direction

**Date:** 15 May 2026  
**Time:** 8:00 AM (Duration: 30 minutes 37 seconds)  
**Attendees:** Sechaba Mohlabeng (Development Lead), Neil Lategan (Product Owner), Tim Atkins (Guest — Data Engineer, AI & Data)  
**Recording:** Capstone Project Check-In-20260515_075950-Meeting Recording

---

## Executive Summary

This session was a live demo of the full end-to-end platform flow, attended for the first time by Tim Atkins, a data engineer joining the AWS AI and Data team. Neil used the session to demonstrate the application to Tim and to surface further product feedback in the context of a fresh audience.

The meeting confirmed that the platform is progressing well and covers the full pipeline from data ingestion through to schema export. However, several targeted improvements were identified across nearly every stage of the flow. The most significant structural feedback was that the **requirements screen needs to be redesigned**: the generated requirements document should occupy the centre of the screen, with chat demoted to a side panel. Additionally, **coherence and validation logic** must be built into the system so that the platform pushes back when uploaded context does not align with the ingested data, and to ensure that all Bus Matrix processes have corresponding fact tables in the generated schema.

The session also established clear **next-step priorities**: run a full end-to-end test using Neil's complete 11-file dataset together with an AI-generated interview transcript as context, review the quality of each stage's outputs, and use a separate model to evaluate those outputs and recommend prompt tuning.

---

## Detailed Discussion by Topic

### 1. Introduction: Tim Atkins

Tim Atkins was introduced as a member of the traditional AI and Data team at Deloitte, described by colleagues as the "legacy" team, who is transitioning to the AWS AI and Data team in approximately two weeks. He has approximately six years of experience at Deloitte focused on on-premises data engineering, and is now stepping into the AI-forward modern data platform space, working with Wessel Cree and focusing on an FSR component.

Neil set expectations clearly before the demo began, noting that he had already told Tim positive things about the application and that the demo should live up to that framing.

### 2. Platform Overview Walkthrough

Sechaba demonstrated the full platform flow from the beginning:

- **Workspace / Projects Page:** Users land on a workspace showing past projects and can create a new project. A new project was created for the demo.
- **Repository Connection:** Users can connect to a GitHub repository during project creation; this is where generated code will be pushed. Access control configurations are also available here.
- **Entry Path Choice:** Users can choose between two starting points: beginning with data first, or beginning with business context and requirements first. The data-first entry path was demonstrated.

Neil mentioned that the **images used as illustrations at the bottom of certain screens** are causing confusion — every time he sees them, he wonders whether they are clickable. He requested that a visible border or frame be added around them to make it unambiguous that they are screenshots and not interactive UI elements.

### 3. Database Connection

Sechaba demonstrated the live database connection feature, which had not been functional in the previous session but is now working. The system can connect to a database and list available tables, which the user can then select for profiling. The connection and table selection were shown live.

Neil asked where the application was running and clarified questions about the database endpoint appearing in the demo environment. He asked Sechaba to continue past that point rather than dwell on it.

### 4. Data Profiling

The profiling stage was shown, with Sechaba noting that it is generating profiling summaries, key call-outs, visual representations of the data, and data samples correctly.

Neil raised the point that it would be valuable to use the **Kaggle dataset** previously discussed for future demos so that two different profiling runs can be compared side by side.

Sechaba acknowledged a previously made comment that profiling was not sophisticated enough. He noted that his current assessment is that testing with more data will be needed to push profiling to the required level, but that the current implementation is running correctly for the data it has been given.

### 5. Data Scope: All 11 Files Must Be Used

Neil pointed out that the dataset he had shared contains not one but **11 data files**. Sechaba had been testing with only one of them and had not noticed there were more. Neil made clear that **all 11 files must be used** together when testing the platform, not just a single file. This is an important correction to Sechaba's testing approach and must be addressed before the next end-to-end test.

### 6. Profiling Summary / Context Handover Page

After profiling, the platform presents an overview page showing key findings, dimension candidates, and the context that will be carried forward into subsequent stages. Sechaba explained that the intent is for this output to represent the relevant context that downstream stages, particularly requirements extraction, will draw on.

The system's modular design was reiterated: the platform was originally a strict pipeline, but has been refactored so that each stage can operate with some independence.

### 7. Requirements Section: Structural Feedback and Redesign Direction

The requirements stage received the most significant UI and design feedback of the session.

Sechaba demonstrated the ability to upload an image as context — a mock-up dashboard — and showed that the platform is now able to accept image uploads and extract business requirements from them. The requirements were displayed with a hierarchy notation (P for process, D for dimension, K for KPI, R for requirement).

Neil confirmed that uploading a target dashboard mock-up is a valid and desirable use case. He also confirmed that uploading an interview transcript is another valid input type. He explicitly asked whether these were possible, not as instructions but as questions, and both were confirmed.

However, Neil raised a major concern about the **layout and priority of what is shown**:

> The chat should be less prominent. The requirements should almost be a requirements document — not a bunch of checks. It should generate the BRD for you, almost. The chat is something on the side.

In other words, the current layout — where the chat interaction dominates and requirements appear as a secondary output — should be **inverted**:
- the **generated BRD (Business Requirements Document)** should be the main, central content of the requirements page,
- and the **chat** should be a smaller side panel for refinement interaction.

This is a significant structural redesign of the requirements stage.

### 8. Prompt Guardrails: Alignment Validation Must Be Built In

During the requirements demo, the uploaded image was not related to the data that had been ingested. Sechaba noted this and pointed out that the system should have flagged the mismatch:

> The system is supposed to say that these things are not aligned. It's supposed to ask you: give me more context, or something like that.

Neil agreed and confirmed this needs to be addressed through **prompt tuning**:

> You need to tune the prompts to actually push back and say, listen, these things will never overlap.

This is a critical validation behaviour. The system must detect when uploaded context or requirements are incompatible with the ingested data and explicitly inform the user rather than silently proceeding with misaligned inputs.

### 9. Bus Matrix Stage

The Bus Matrix stage was shown. Sechaba noted a UI issue that still needs to be resolved but walked through the core functionality: users can generate a Bus Matrix from scratch or via AI using the accumulated context from prior stages.

Neil responded positively to the modular generation options. The AI-generated Bus Matrix was triggered and displayed, showing business processes mapped against dimensions.

The main concern raised was that the schema generated downstream should contain a **fact table for every process in the Bus Matrix**. Sechaba observed that the current YAML output only had one fact showing, which is insufficient. Neil confirmed:

> We need to have all the facts.

This means coherence validation must be introduced: the system should verify that every process defined in the Bus Matrix maps to a corresponding fact table in the generated schema, and surface a warning or retry if any are missing.

### 10. Schema Generation and YAML View

The schema stage was shown, including the YAML representation of the generated dimensional model. As above, the main issue identified was that not all fact tables were appearing in the YAML output — a coherence problem that needs to be addressed through guardrails or prompt improvements.

Sechaba also noted that the schema editor's visual layout still requires attention.

### 11. Export Stage: Missing Loading Indicator

Sechaba flagged a UX gap in the export stage: when the user clicks the button to proceed to the next step, there is a noticeable lag with no loading indicator shown. A loading state must be added to cover this transition so users understand the system is working.

Neil confirmed that a loading indicator is already shown in the middle of the screen, but Sechaba clarified the specific gap is when clicking the forward navigation button, not within the export action itself.

Neil also noted that exporting to PNG is not sufficient. The export format must support **DBT-compatible YAML or equivalent code output** (described as "Royal" in the transcript, interpreted as referring to the DBT export format), which was confirmed as a pending item.

### 12. Schema Documentation

The export stage also includes generated documentation for the schema — something discussed in previous sessions. This was shown to be partially functional: documentation is generated and displayed for use in client engagements.

### 13. Deployment Stage

The deployment stage, which would push generated code to the connected GitHub repository, was noted as still being incomplete and remaining as future work.

### 14. Tim Atkins' Summary Observations

Tim summarised his understanding of the tool after the walkthrough:

> So this is a facility for somebody in the business to scribble something on a whiteboard, take a picture, throw it at this place — it connects to the database and you build out a data model.

Neil confirmed this framing, adding that the tool can work with anything from informal whiteboard scribbles through to structured migration artefacts from one system to another:

> Any content or context will help it uncover what are the requirements to get the dimensional model.

Tim noted the value of the feature that highlights the gap between a business vision and what the data actually supports:

> Highlighting the gaps between a vision and what data you have is also very powerful. Sometimes these guys' visions go beyond what is actually available — and it's also an opportunity for them to go and find where the data is sitting.

This affirmed the importance of the **validation and alignment-checking** behaviour discussed earlier in the session.

Tim also expressed interest in how the front end was built. Sechaba confirmed it was built using GitHub Copilot as the primary development tool, and that the framework is **Next.js** (React), which can be run serverlessly.

### 15. Next Steps Agreed by Neil

Neil summarised a clear testing and iteration plan for the sessions ahead:

1. Neil will share the **AI-generated interview transcript** based on the 11-file dataset for use as context input during the requirements stage.
2. Sechaba should run a **full end-to-end test** using all 11 files plus the interview transcript, going through every stage from data ingestion to schema generation.
3. For each stage, the outputs should be taken and given to a **fresh model** (a separate AI reviewer) with the prompt:
   > Here are the inputs; review the outputs. What prompt modifications should be made to get it more aligned with the correct result?
4. This review loop should be repeated for the requirements, Bus Matrix, and schema stages in sequence.

### 16. Target Environment Confirmed

Neil confirmed the **target deployment environment** for generated code:
- **Runtime:** DBT (local, not DBT Cloud for now)
- **Target Database:** Redshift

This sets the technical output target for the code generation and export stages.

### 17. Light Theme

Neil explicitly requested a **light theme** as an additional deliverable. This is noted as a lower-priority cosmetic item but has now been formally requested. Tim joked that it might be as easy as asking Copilot to "make it light" — Neil acknowledged that while it can sometimes be that straightforward, it often involves cascading CSS changes.

---

## Action Items from Session

| Category | Action | Owner | Due | Priority |
|---|---|---|---|---|
| **UI – General** | Add a visible border or frame around illustration images to make it clear they are non-interactive screenshots. | Sechaba | Next Sprint | MED |
| **Data Handling** | Use all 11 files from Neil's dataset in testing — do not use only a single file. | Sechaba | Immediate | HIGH |
| **Requirements UI** | Redesign the requirements page so the generated BRD is the main central content and chat is a smaller side panel. | Sechaba | Before Next Meeting | HIGH |
| **Requirements Logic** | Add prompt guardrails so the system detects and explicitly flags when uploaded context does not align with the ingested data. | Sechaba | Before Next Meeting | HIGH |
| **Bus Matrix / Schema** | Implement coherence validation ensuring every Bus Matrix process has a corresponding fact table in the generated schema. | Sechaba | Next Sprint | HIGH |
| **Schema Export** | Add DBT-compatible YAML / code export (not just PNG export). | Sechaba | Next Sprint | HIGH |
| **UX** | Add a loading indicator when clicking the forward navigation button in the export stage to cover the lag. | Sechaba | Next Sprint | MED |
| **Testing** | Run a full end-to-end test using all 11 dataset files and the AI-generated interview transcript from Neil as context input. | Sechaba | Before Next Meeting | HIGH |
| **Prompt Tuning** | After the end-to-end test, pass each stage's outputs to a fresh model and ask it to review quality and suggest prompt modifications. | Sechaba | Before Next Meeting | HIGH |
| **Deployment** | Confirm target output environment: DBT local with Redshift as target database. Design export accordingly. | Sechaba | Next Sprint | HIGH |
| **UI – Theme** | Implement a light theme option. | Sechaba | Future Sprint | MED |
| **Content Inputs** | Ensure the requirements/context upload supports a broad range of input types including images, transcripts, and documents. | Sechaba | Ongoing | MED |

---

## Open Questions & Future Considerations

1. **Interview Transcript Input:** How will the system process and weight a full interview transcript relative to structured data already profiled?
2. **Coherence Validation Scope:** Should the alignment check between uploaded context and ingested data happen at the requirements stage only, or should it be applied at every stage that accepts user input?
3. **DBT Export Format:** What exact DBT YAML structure should the export stage produce for Redshift as the target database?
4. **Fact Table Completeness:** What is the most robust mechanism for ensuring all Bus Matrix processes produce corresponding facts in the schema — prompt engineering, post-generation validation, or a hybrid approach?
5. **Prompt Tuning Loop:** Should the external "reviewer model" step become a permanent part of the platform's workflow, or is it only an offline iteration tool for this development phase?
6. **Light Theme:** Can a light/dark theme toggle be added as a global UI switch without requiring a full redesign of component-level styles?

---

## Summary & Next Steps

This session confirmed that the platform is functional across its full end-to-end flow and is ready to be tested with a real, complete dataset and real contextual input. Tim Atkins validated the concept from a fresh perspective and provided positive but practically grounded feedback.

The immediate priorities coming out of this session are:

1. **Use all 11 dataset files** from Neil's dataset — not just one.
2. **Redesign the requirements page** to make the generated BRD the primary content and demote chat to a side panel.
3. **Add alignment validation prompts** so the system flags when context and data do not match.
4. **Ensure all Bus Matrix processes produce fact tables** in the schema, and add a guardrail if any are missing.
5. **Run a full end-to-end test** using the complete dataset and Neil's AI-generated interview transcript, then iterate on each stage's prompts using a reviewer model.

The next session should ideally include a working demonstration of the above changes together with a completed end-to-end run using real, coherent data and context inputs.
