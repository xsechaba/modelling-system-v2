# Dim-Wiz Platform — System Architecture

> **Date:** 11 May 2026
> **Status:** Updated for Modular/Knowledge-Based Scope

This document outlines the 5-layer architecture of the Dim-Wiz automated data modelling platform, incorporating the strategic pivot from a linear wizard to a modular, knowledge-driven workspace that supports both data-first and requirements-first entry paths.

---

## Layer 1 – Presentation Layer (The Modular Workspace)
*Meaning of this layer: The front-end user interface. It is no longer a locked, linear sequence, but a suite of interoperable workspaces that can be accessed in any order.*

- **Project Home & Entry Selector:** The starting point. Users choose their entry path here: Data-First (source data) or Requirements-First (business context).
- **Ingestion Workspace:** Where data (CSVs) or live database connections are configured.
- **Profiling View:** The Kaggle-style dashboard displaying deterministic profiling results (nulls, distributions, types).
- **Requirements & Discovery Workspace:** The chat and document upload interface where business goals, KPIs, and industry context are captured. Functions as the starting point for the Requirements-First path.
- **Bus Matrix Editor:** The interactive grid where business processes and dimensions are mapped and reviewed.
- **Schema Architect:** The visual ERD editor. Now features star-schema auto-layout, cardinality edge labels, and manual override capabilities. Includes the new **Documentation Export** capabilities.
- **Code Gen & Deploy Console:** The unified screen where the approved model is compiled into DDL/dbt artifacts, semantic layer code, and directly deployed to target warehouses or pushed to GitHub.
- **Admin & Settings:** Organization, user, and global configuration management.

## Layer 2 – Application Layer (Control & Support)
*Meaning of this layer: The backend services that manage state, connections, and deterministic logic. The core change here is the shift from linear workflow control to a shared knowledge store.*

- **Knowledge Context Manager:** Replaces the old linear workflow controller. It maintains a unified "Project Knowledge Base" combining data profiles, chat history, KPIs, and schema state. All UI tabs read from and write to this central state.
- **Data Profiling Engine (Rules-Based):** Runs fast, deterministic checks (null counts, distinct counts, simple stats, type detection) on samples without using AI.
- **Access Controller (RBAC):** Manages NextAuth sessions, permissions, and multi-tenant project isolation.
- **Integration Orchestrator:** Manages secure connections to live databases, executes sample queries, and handles AWS S3 file persistence.
- **GitHub / Version Control Manager:** Handles branch creation, commits, and Pull Requests for generated code artifacts.

## Layer 3 – Agentic Layer (AI & Reasoning)
*Meaning of this layer: The reasoning engine powered by Claude via AWS Bedrock. These agents act upon the Shared Knowledge Context to generate proposals and outputs.*

- **Profile Interpretation Agent:** Analyzes the deterministic profiling results to explain risks, anomalies, and likely modelling clues.
- **Requirement / KPI Agent:** Conducts interviews, parses uploaded context documents, and extracts structured KPIs and business rules.
- **Model Proposal Agent (NEW):** A specialized agent for the Requirements-First path. It proposes dimensional models based on industry templates and business context before any data is ingested.
- **Bus Matrix Agent:** Structures gathered business processes and dimensions into a conformed matrix.
- **Agentic Dimensional Model Generator:** Converts the requirements and bus matrix into a draft dimensional star schema.
- **Schema Modification Agent:** A chat-based assistant within the Schema Architect that executes structural changes requested via natural language.
- **Code Gen Agent:** Converts the approved conceptual model into physical implementation outputs, including dbt SQL, YAML, and (in future) BI semantic layer definitions.

## Layer 4 – Data & Integration Layer (Sources & Outputs)
*Meaning of this layer: The physical data boundaries — what enters the platform, where internal state lives, and where artifacts are delivered.*

- **Input Sources:**
  - **Uploaded Files:** CSV data samples and Context Documents (PDF, DOCX) stored securely in AWS S3.
  - **Live Source DBs:** Secure connections to operational systems for metadata extraction.
- **The Shared Knowledge Context:** The persistent, JSON-based single source of truth for a project, tracking all known data constraints and business requirements.
- **Outputs & Destinations:**
  - **Target Data Warehouse:** The destination where the final DDL/schema is executed (e.g., Snowflake, RDS).
  - **GitHub Repositories:** Where generated dbt packages, SQL files, and documentation artifacts are persisted.
  - **Documentation & Semantic Models (NEW):** Markdown docs, ERD image exports, and BI tool logic (DAX/LookML).

## Layer 5 – Shared Infrastructure Layer
*Meaning of this layer: The foundational technology stack and cross-cutting services used across the entire platform.*

- **Relational Datastore (PostgreSQL via Prisma):** The primary database for user profiles, organizations, projects, and session contexts (migrated from SQLite).
- **AWS Bedrock / LLM:** The foundation model service (Anthropic Claude) utilized by the Agentic Layer.
- **Memory & Context Store:** The vector or document storage handling conversational context and large business requirement documents.
- **Prompt Management:** The centralized repository for storing, versioning, and executing system prompts.
- **Logs & Audit Trail:** Activity history, system logs, and data security traceability.
- **Security & Monitoring:** System encryption, IAM/Roles, and monitoring/alerts.