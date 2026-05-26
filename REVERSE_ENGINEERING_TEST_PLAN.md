# Reverse-Engineering Test Plan — Olist Brazilian E-Commerce Dataset

## Purpose

We have a **dataset** (9 CSVs from the Olist Brazilian marketplace) and **6 stakeholder interview transcripts** conducted Kimball-style with executives across Operations, Logistics, Finance, CX, Seller Management, and Catalogue.

**They are directly related.** The interviews discuss the exact columns, tables, and business rules present in the dataset (order statuses, payment types, freight, reviews, seller handoff timestamps, etc.). The 6th transcript is a cross-functional alignment session that surfaces definition conflicts.

The goal: **reverse-engineer the "perfect" output at every stage of dim-wiz**, then compare what the system actually produces, identify gaps, and fix them — so the system produces best-possible results not just for this dataset, but for any dataset.

---

## Approach — Work Backwards

We start from the **end** (schema + SQL) and work backwards to the **beginning** (upload + profile), defining the gold-standard output at each stage. Then we run the system forward and compare.

---

## Stage-by-Stage Plan

### Stage 1: Define the Perfect Schema (Star Schema ERD)

**Input:** The 9 CSV files + the 6 interview transcripts (which define business rules, grain, and KPI requirements).

**What we determine:**
- What fact tables should exist and at what grain
- What dimension tables should exist
- What the relationships (foreign keys) should be
- What conformed dimensions are shared across facts
- What derived/calculated columns belong in each table

**Expected outcome (based on data + interviews):**

| Table | Type | Grain | Key Columns |
|-------|------|-------|-------------|
| `fct_order_items` | Fact | One row per order-item | order_id, order_item_id, product_id, seller_id, price, freight_value, shipping_limit_date |
| `fct_order_payments` | Fact | One row per payment line | order_id, payment_sequential, payment_type, payment_installments, payment_value |
| `fct_order_reviews` | Fact | One row per review | review_id, order_id, review_score, review_creation_date, review_answer_timestamp |
| `dim_customers` | Dimension | One row per unique customer | customer_unique_id, customer_zip_code_prefix, customer_city, customer_state |
| `dim_sellers` | Dimension | One row per seller | seller_id, seller_zip_code_prefix, seller_city, seller_state |
| `dim_products` | Dimension | One row per product | product_id, product_category_name, category_name_english, weight, dimensions, photos_qty |
| `dim_orders` | Dimension (degenerate/bridge) | One row per order | order_id, customer_id, order_status, purchase_timestamp, approved_at, delivered_carrier_date, delivered_customer_date, estimated_delivery_date |
| `dim_geography` | Dimension | One row per zip prefix | zip_code_prefix, city, state, lat, lng |
| `dim_date` | Dimension (role-playing) | One row per calendar date | date_key, year, quarter, month, day, day_of_week, is_weekend |

**Key design decisions (from interviews):**
- Order grain vs order-item grain: both needed (Interview 1, 3)
- Freight kept separate from product price (Interview 4 — Mari insists)
- Multiple payment rows per order is normal — don't collapse (Interview 4)
- Reviews attach to orders, not items — attribution is imperfect (Interview 3, 5)
- Geography must be segmentable — don't average across Brazil (Interview 2, 3)
- Seller performance measured at item level, not order level (Interview 3)
- On-time delivery has 3 definitions: seller SLA, customer SLA, total pipeline (Interview 2)

**Deliverable:** A gold-standard ERD with table definitions, columns, types, and relationships.

---

### Stage 2: Define the Perfect SQL / dbt Models

**What we determine:**
- What the staging SQL looks like (source → cleaned)
- What the mart SQL looks like (joined star schema)
- What calculated fields exist (delivery delay days, on-time flags, GMV proxies, etc.)

**Key calculated fields (from interviews):**
- `seller_delay_days` = `delivered_carrier_date` - `shipping_limit_date` (Interview 2)
- `delivery_delay_days` = `delivered_customer_date` - `estimated_delivery_date` (Interview 2)
- `total_pipeline_days` = `delivered_customer_date` - `approved_at` (Interview 2)
- `is_seller_late` = flag if seller_delay_days > 0
- `is_delivery_late` = flag if delivery_delay_days > 0
- `gmv_product` = SUM(price) — merchandise only (Interview 4)
- `gmv_total` = SUM(price + freight_value) — customer-facing (Interview 4)
- `review_sentiment_bucket` = 1-2 = pain, 3 = disappointment, 4 = acceptable, 5 = positive (Interview 5)

**Deliverable:** Gold-standard dbt SQL files (staging + marts) with proper materializations.

---

### Stage 3: Define the Perfect Bus Matrix

**What we determine:**
- What business processes map to which fact tables
- Which dimensions are conformed across processes
- The classic Kimball Bus Matrix grid

**Expected Bus Matrix:**

| Business Process | dim_date | dim_customers | dim_sellers | dim_products | dim_geography | dim_orders |
|---|---|---|---|---|---|---|
| Order Item Sales | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Payments | ✓ | ✓ | | | | ✓ |
| Reviews | ✓ | ✓ | | | | ✓ |

**Deliverable:** Gold-standard bus matrix table.

---

### Stage 4: Define the Perfect Requirements (BRD)

**What we determine:**
- What business processes the BA Agent should extract from the transcripts
- What dimensions and KPIs should be identified
- What business rules should be captured
- What the conversation flow should look like

**Expected requirements (from the 6 interviews):**

**Processes:**
- Order fulfilment lifecycle (purchase → approval → seller handoff → delivery)
- Payment processing (multi-type, multi-row, installments)
- Customer review & feedback
- Seller performance management

**Dimensions:**
- Customer (geography, unique identity)
- Seller (geography, fulfilment behavior)
- Product (category, physical attributes)
- Time/Date (role-playing: purchase, approval, delivery, review)
- Geography (zip, city, state, lat/lng)

**KPIs:**
- GMV (product only) vs Total Order Value (product + freight)
- On-time delivery rate (3 variants per TK)
- Seller fulfilment rate (shipped before limit)
- Review score distribution (not averages — per Camila)
- Payment type mix and installment behavior
- Geographic performance segmentation

**Deliverable:** Gold-standard BRD with all processes, dimensions, KPIs, and business rules.

---

### Stage 5: Define the Perfect Profile Summary

**What we determine:**
- What the data profiler should detect from the 9 CSVs
- What column types, distributions, nulls, cardinalities should show
- What the AI interpretation should highlight

**Expected profile highlights:**
- `olist_orders_dataset`: 8 columns, ~100k rows, timestamps with nulls in delivered dates (cancelled/processing orders), order_status categorical with dominant "delivered"
- `olist_order_items_dataset`: multi-row per order (order_item_id > 1 = multi-item orders), price and freight numeric with outliers
- `olist_order_payments_dataset`: multi-row per order (payment_sequential), 4 payment types, installments 1-24
- `olist_order_reviews_dataset`: review_score 1-5 skewed toward 5, many null comments
- `olist_customers_dataset`: customer_id vs customer_unique_id (same person, different orders)
- `olist_products_dataset`: category names in Portuguese, some nulls, physical dimensions present
- `olist_sellers_dataset`: seller geography, smaller cardinality than customers
- `olist_geolocation_dataset`: multiple rows per zip prefix (many lat/lng per zip), highest row count
- `product_category_name_translation.csv`: lookup table, Portuguese → English

**Deliverable:** Gold-standard profile summary with callouts, anomalies, and join-key identification.

---

## Execution Process

We will work through this **iteratively, one stage at a time**, in this order:

### Round 1: Define Gold Standards (what "perfect" looks like)
1. ✏️ Write the perfect schema ERD
2. ✏️ Write the perfect SQL/dbt models
3. ✏️ Write the perfect bus matrix
4. ✏️ Write the perfect requirements BRD
5. ✏️ Write the perfect profile summary

### Round 2: Run the System Forward (upload the data, use the transcripts)
6. ▶️ Upload the 9 CSVs into dim-wiz
7. ▶️ Run the profiler — compare output to gold-standard profile
8. ▶️ Use transcripts in requirements chat — compare extracted requirements to gold-standard BRD
9. ▶️ Generate bus matrix — compare to gold-standard matrix
10. ▶️ Generate schema — compare to gold-standard ERD
11. ▶️ Generate SQL/exports — compare to gold-standard dbt models

### Round 3: Gap Analysis & Fixes
12. 🔍 For each stage, identify gaps between actual and gold-standard output
13. 🔧 Determine root cause: prompt weakness? missing validation? bad guardrails? UI issue?
14. 🛠️ Fix each gap — could be:
    - Strengthening prompts (more specific instructions, examples, constraints)
    - Adding validation checks (e.g., every process must map to a fact table)
    - Adding guardrails (e.g., AI can't hallucinate processes not grounded in data)
    - Improving profiling (e.g., detect join keys, detect multi-row grain)
    - Adding coherence checks between stages (bus matrix ↔ schema alignment)

### Round 4: Re-test & Confirm
15. ♻️ Re-run the system with the same dataset + transcripts
16. ✅ Confirm outputs match or closely approach the gold standard
17. 📝 Document any remaining known limitations

---

## Key Principle

Every fix must be **generalizable** — not hard-coded for this dataset. The goal is a system that produces excellent results for *any* dataset and *any* set of stakeholder interviews, not just Olist.

---

## Files

| Asset | Location |
|-------|----------|
| Dataset (9 CSVs) | `test_data/brazilian-public-dataset/` |
| Interview Transcripts (6 files) | `test_data/meeting-transcripts/` |
| This plan | `REVERSE_ENGINEERING_TEST_PLAN.md` |
