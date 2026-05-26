# Playwright Test Report
**Date:** 2026-05-21  
**Total:** 104 tests · 89 passed · 7 failed · 8 skipped · 8.0 minutes  
**Coverage:** Every page in the application.

---

## Overall Scorecard

| Category | Tests | Result |
|---|---|---|
| Public pages (Homepage, Login, Signup) | 16 | ✅ All passed |
| Authenticated nav (Projects list, Profile settings, Project settings) | 13 | ✅ All passed |
| Individual project dashboard (`/projects/:id`) | 3 | ✅ All passed |
| Wizard: Upload | 3 | ✅ All passed |
| Wizard: Profile/Interpret | 3 | ✅ All passed |
| Wizard: Requirements BA Agent | 3 | ✅ All passed |
| Wizard: Bus Matrix | 2/3 | ⚠️ 1 failed |
| Wizard: Schema Editor (Review) | 3 | ✅ All passed |
| Wizard: Export | 3 | ✅ All passed |
| Wizard: Deploy | 3 | ✅ All passed |
| Wizard: Maintenance & Observability | 3 | ✅ All passed |
| Wizard feature tests (upload, chat, ERD, modal) | 9 | ✅ All passed |
| Light mode audit (all pages) | 17 | ✅ All passed |
| CSS variable / dark-mode baseline | 4 | ✅ All passed |
| Pipeline coherence | 1/9 | ⚠️ 3 failed, 5 skipped (expected — no AI data) |
| Auth boundaries | 0/3 | ❌ All 3 failed |
| Break / edge cases | 8 | ✅ All passed |
| Responsiveness | 2 | ✅ All passed |

---

## Failures — Detail

### 1 · Bus Matrix — no visible heading in empty/loading state
**Test 40** — `tests/03-wizard-steps.spec.ts` — *Bus Matrix step: key UI elements are present*

The page renders a full-screen loading spinner: *"AI is mapping KPIs to the Bus Matrix…"* while waiting for the AI API call to resolve. The spinner uses a `<p>` tag — no `<h1>` or `<h2>` is present. Zero heading elements found on the page.

**Finding:** The Bus Matrix loading/empty state has no accessible heading. The entire content area is a blank dark canvas with a single line of spinner text — no orientation for the user.

---

### 2–4 · Coherence checks — no AI data in test project (expected)
**Tests 81, 82, 83** — `tests/05-coherence.spec.ts`

| Test | Finding |
|---|---|
| `bankedRequirements is non-empty` | Count = 0. Requirements stage has never run on the test project. |
| `busMatrix is non-empty` | `undefined`. Bus matrix AI has never run. |
| `schema is non-empty` | Nodes = 0, Edges = 0. Schema generation has never run. |

Tests 84–90 (downstream coherence checks) and test 80 ("state data is accessible") were correctly skipped because the project state is empty.

**Note:** These failures are intrinsic to the test environment. The test project is freshly created with no AI pipeline activity. The coherence logic itself is untestable without running the AI pipeline end-to-end. This is a test-data gap, not an application bug.

---

### 5 · `/projects` is accessible without authentication — SECURITY FINDING
**Test 91** — `tests/06-break-testing.spec.ts` — *accessing /projects without auth redirects to login*

A brand-new browser context with **no cookies and no session** navigated to `http://localhost:3000/projects` and received the **full projects dashboard** — showing "Workspaces", the test project card, "New Project" button, and the user avatar. The expected redirect to `/auth/login` never happened (10 s timeout).

**Finding:** The Next.js middleware (`middleware.ts`) is not protecting the `/projects` route. The projects page is a React Server Component that calls `getServerSession`, but when that returns `null` for an unauthenticated request, the redirect is either absent or not firing correctly.

---

### 6 · `/wizard/:id/upload` does not redirect to login — shows 404 instead
**Test 92** — `tests/06-break-testing.spec.ts` — *accessing wizard without auth redirects to login*

Unauthenticated navigation to `/wizard/somefakeid/upload` returned a **Next.js 404 "This page could not be found."** — it never redirected to `/auth/login`.

**Finding:** The wizard layout performs a project lookup (`prisma.project.findUnique`) before the auth check. For a non-existent project ID the page 404s before auth can redirect. For a real, existing project ID accessed unauthenticated, the page likely renders fully (consistent with finding #5 above).

---

### 7 · `GET /api/projects` returns 405, not 401
**Test 93** — `tests/06-break-testing.spec.ts` — *accessing API without auth returns 401*

An unauthenticated `GET` request to `/api/projects` returned **HTTP 405 Method Not Allowed**, not 401 or 403.

**Finding:** The API route only defines a `POST` handler. The route checks the HTTP method before checking auth, so an unauthenticated request gets a 405 instead of a 401. A properly hardened API returns 401 first, regardless of method.

---

## Light Mode Audit — Page by Page

| Page | Light Mode Status | Notes |
|---|---|---|
| `/` Homepage | ⚠️ CSS debt | See below |
| `/auth/login` | ✅ Clean | — |
| `/auth/signup` | ✅ Clean | — |
| `/projects` | ✅ Clean | — |
| `/settings/profile` | ✅ Clean | — |
| `/projects/:id` (project dashboard) | ✅ Clean | — |
| `/wizard/:id/upload` | ✅ Clean | — |
| `/wizard/:id/profile` | ✅ Clean | — |
| `/wizard/:id/requirements` | ✅ Clean | — |
| `/wizard/:id/bus-matrix` | ✅ Clean | — |
| `/wizard/:id/review` (Schema Editor) | ⚠️ Minor | See below |
| `/wizard/:id/export` | ✅ Clean | — |
| `/wizard/:id/deploy` | ✅ Clean | — |
| `/wizard/:id/maintenance` | ✅ Clean | — |

### Homepage issues (2 categories)

**Hardcoded dark backgrounds — 5 elements** rendering `rgb(5,5,5)` / `rgb(10,10,10)`.  
These are the hero section's product mockup divs (a dark "app preview" screenshot embedded in the marketing section). They are intentionally dark. CSS debt / design decision.

**White text on brand-accent backgrounds — 5 elements.**  
`btn-primary` and feature-grid cells use `color: white` over the brand accent palette:

| Background | Colour | Contrast ratio | WCAG AA (4.5:1) |
|---|---|---|---|
| `#86bc25` (lime green) | white | ~2.9:1 | ❌ Fails |
| `#0ea5e9` (sky blue) | white | ~3.1:1 | ❌ Fails |
| `#a855f7` (purple) | white | ~4.6:1 | ✅ Passes |
| `#f59e0b` (amber) | white | ~2.8:1 | ❌ Fails |

### Schema Editor (`/wizard/:id/review`) issue

**1 `<button class=btn-primary>`** — white text on `rgb(134,188,37)` = `#86bc25` (brand lime green). Same contrast issue as the homepage primary button. In light mode the brand-green button retains white text, which is ~2.9:1 contrast ratio.

---

## CSS / Theme System — Verified Working

| Check | Result |
|---|---|
| Dark mode is default on first load (no localStorage) | ✅ |
| Theme toggle switches between dark and light on every page | ✅ |
| `--bg-page` resolves to `#f5f7fa` in light mode | ✅ |
| `--color-white` resolves to `#0f172a` (dark text) in light mode | ✅ |
| Nav: `rgba(255,255,255,0.85)` bg / `rgb(15,23,42)` text in light mode | ✅ Good contrast |

---

## Other Verified Features

| Feature | Result |
|---|---|
| File upload (`setInputFiles`) with `products.csv` and `sales_transactions.csv` | ✅ Works |
| Upload zone file-input accepts CSV | ✅ |
| Requirements: chat panel + banked requirements sidebar present | ✅ |
| Requirements: search box in sidebar | ✅ |
| Schema Editor: ReactFlow canvas renders | ✅ |
| Schema Editor: AI chat panel visible | ✅ |
| Schema Editor: Add Custom Table opens modal (not browser prompt) | ✅ |
| Schema Editor: Visual ERD / YAML toggle buttons | ✅ |
| Export: generate/download actions visible | ✅ |
| 404 for completely made-up routes | ✅ |
| Invalid project ID → `/api/.../state` returns 404 (not 500 crash) | ✅ |
| Empty message sent to schema chat — no crash | ✅ |
| Requirements page renders without JS errors | ✅ |
| Requirements search with special characters — no crash | ✅ |
| Bus Matrix page renders without crashing | ✅ |
| Export page renders without crashing | ✅ |
| Projects page layout not broken at 1280×900 | ✅ |
| Homepage has no horizontal overflow | ✅ |

---

## Summary of Actionable Findings

| # | Finding | Severity | Location |
|---|---|---|---|
| 🔴 1 | `/projects` fully accessible without authentication | High | `middleware.ts` / `app/projects/page.tsx` |
| 🔴 2 | Wizard pages don't redirect to login (404 for fake IDs; likely renders for real IDs) | High | `app/wizard/[projectId]/layout.tsx` |
| 🟠 3 | `GET /api/projects` returns 405 before auth check — should return 401 first | Medium | `app/api/projects/route.ts` |
| 🟠 4 | Bus Matrix loading state has no heading — blank screen while waiting for AI | Medium | `app/wizard/[projectId]/bus-matrix/page.tsx` |
| 🟡 5 | White text on `#86bc25` (lime green) in light mode — contrast ratio ~2.9:1, below WCAG AA | Low | `globals.css` `.btn-primary` |
| 🟡 6 | Hero mockup divs have hardcoded `#050505` background (intentional design decision) | Low / Design debt | `app/page.tsx` |
| 🔵 7 | Coherence tests require AI pipeline data — no seeded test state available | Info | `tests/05-coherence.spec.ts` |
