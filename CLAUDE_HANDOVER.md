# 🤖 HANDOVER FOR CLAUDE CODE

This document is updated after each Claude session. Last updated: 2026-03-28 by Claude Code (local).

---

## 1. Project Context: UniAudit v2.0

Full-stack B2B platform for AI-auditing university admission websites. Business model: cold-pitch universities with a free audit report as proof of value, then sell consulting.

### Tech Stack
- **Backend:** Python 3.12, FastAPI, Motor (async MongoDB Atlas), Playwright, Azure OpenAI
- **Frontend:** React 18, Vite, Tailwind CSS, Framer Motion, Recharts
- **Hosting:** Vercel (frontend, auto-deploy via GitHub Actions), Azure VM OpenClaw (backend via Nginx proxy on port 80)

### Critical Azure OpenAI Rules
- Use `max_completion_tokens` — NOT `max_tokens`
- Do NOT pass `temperature`
- Header: `api-key`, endpoint: `/openai/v1/chat/completions`
- Model: `gpt-5.4-nano`

---

## 2. Architecture Snapshot (as of 2026-03-28)

### Backend (`backend/src/`)
```
api/routes.py          — All FastAPI endpoints
analyzer/analyzer.py   — AI analysis with function calling + exponential backoff retry
analyzer/benchmarks.py — Competitor benchmarking vs top-200 universities
analyzer/metrics.py    — Score calculations & percentiles
crawler/crawler.py     — Playwright crawler with branch pruning
generator/guide_generator.py — HTML guidebook compiler
```

### Frontend (`frontend/src/`)
```
pages/
  Dashboard.tsx          — University list + status cards
  UniversityDetail.tsx   — 6-tab detail view (Overview, Pages, Tree, Graph, Metrics, Outreach)
  PageReport.tsx         — Per-page analysis detail
  GuideGenerator.tsx     — Generate & view HTML guidebook
  Brandbook.tsx          — Clawforge design system reference (standalone, no Layout)
  PlaygroundPage.tsx     — (standalone, no Layout)

components/
  layout/Layout.tsx      — Sidebar + main with GeometricPattern background
  ui/ErrorBoundary.tsx   — Global + per-route error boundary (class component)
  university/OutreachTab.tsx — AI cold email generator
```

### API Routes (all under `/api`)
```
POST   /universities
GET    /universities
GET    /universities/{id}
DELETE /universities/{id}
POST   /universities/{id}/crawl              (background task)
POST   /universities/{id}/analyze            (background task)
GET    /universities/{id}/status
GET    /universities/{id}/pages
GET    /universities/{id}/pages/{page_id}
GET    /universities/{id}/tree
GET    /universities/{id}/graph
GET    /universities/{id}/metrics
POST   /universities/{id}/generate-guide
GET    /universities/{id}/guide
POST   /universities/{id}/generate-outreach  ← NEW
```

### Mixed Content Fix (DO NOT TOUCH)
- `vercel.json` rewrites `/api/*` → `http://20.240.202.14:8000/api/*`
- `api.ts` uses empty string `""` as `API_URL` in production (relative paths)
- This is what makes HTTPS Vercel → HTTP Azure VM work

---

## 3. Completed Work

### ✅ Session 1 (OpenClaw cloud)
- Mixed Content fix (vercel.json + api.ts)
- Clawforge design system port (tailwind.config.ts, index.css, PageHeader, GeometricPattern, Breadcrumbs)
- Migrated all components from legacy tokens to semantic tokens (bg-background, bg-card, etc.)

### ✅ Session 2 (Claude Code local — 2026-03-28)
- **Error Boundary** (`frontend/src/components/ui/ErrorBoundary.tsx`) — global wrap in App.tsx + per-route isolation on every page; shows styled "Try again" fallback instead of white/black crash screen
- **Outreach Generator** — full feature:
  - Backend: `POST /api/universities/{id}/generate-outreach` with `OutreachRequest` body (contact_name, contact_title, tone). Pulls audit summary from DB, calls Azure OpenAI for a personalised cold email pitch, returns `{subject, body, tone, audit_score}`.
  - Frontend: `OutreachTab.tsx` with contact form + tone picker (Professional / Consultative / Friendly) + copy-to-clipboard for subject/body/full email
  - Wired into UniversityDetail as 6th tab (only active when status=completed)

---

## 4. What's Left / Next Priorities

### 🎯 Priority 1: UI Polish pass
OpenClaw did a bulk token replacement but some areas still look rough. Specifically:
- `PageTable.tsx` — table rows might need tighter spacing and hover states
- `UniversityDetail.tsx` Overview tab — the ScoreGauge grid on mobile
- `SiteGraph.tsx` — check node/edge colours use semantic tokens not hardcoded hex

### 🎯 Priority 2: Real-time crawl/analysis status polling
Currently the user has to manually refresh to see crawl progress. Add polling in `UniversityDetail.tsx`:
- When `status === 'crawling' || status === 'analyzing'`, poll `GET /universities/{id}/status` every 3s using `refetchInterval` in the `useUniversity` query
- Show a live progress bar or animated badge

### 🎯 Priority 3: Outreach — save & history
Currently generated emails are lost on page refresh. Add:
- Backend: store outreach results in a `outreach` MongoDB collection
- Frontend: list past generated emails per university in the Outreach tab

### 🎯 Priority 4: Delete confirmation modal
`useDeleteUniversity` mutation exists in api.ts but no UI delete button anywhere. Add a delete option (gear icon or kebab menu on Dashboard cards) with a confirm modal.

---

## 5. Critical Rules (DO NOT VIOLATE)

1. **Never touch `api.ts` proxy logic or `vercel.json`** — routing is fragile
2. **Theme tokens only** — `bg-background`, `bg-card`, `border-border`, `text-primary`, `text-muted-foreground`. No hardcoded hex in components.
3. **Azure OpenAI** — always `max_completion_tokens`, never `temperature`, never `api-version` query param
4. **Backend AI calls** — use `httpx` directly (not openai SDK), see `_call_openai` in `analyzer.py` or `_call_openai_text` in `routes.py` as reference

Good luck!
