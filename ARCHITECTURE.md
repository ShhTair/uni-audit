# UniAudit — Architecture

## Overview

```
Browser (Vercel HTTPS)
  └─ /api/* → Vercel Edge Rewrite → HTTP Azure VM :80
                                         └─ Nginx → FastAPI :8000
                                                        └─ MongoDB Atlas
                                                        └─ Azure OpenAI
```

Mixed-content problem (HTTPS frontend → HTTP backend) is solved via Vercel Edge rewrites.
**Do not change `vercel.json` or `api.ts` API_URL logic.**

---

## Backend (`backend/src/`)

```
main.py                     FastAPI app init, DB connect, CORS
config.py                   Settings via pydantic-settings (.env)

api/
  routes.py                 All API endpoints

models/
  university.py             Pydantic models + MongoDB serializers
  tags.py                   Tag definitions + weights

crawler/
  crawler.py                Auto mode: Playwright BFS with branch pruning
  targeted_crawler.py       Manual mode: httpx + html2text, no browser
  cloudflare_crawler.py     CF mode: Cloudflare Browser Rendering API
  discoverer.py             Pre-crawl URL discovery (sitemap + homepage links)
  content_extractor.py      HTML → structured content (BS4)

analyzer/
  analyzer.py               AI analysis with Azure OpenAI function calling
  benchmarks.py             Competitor benchmarking vs top-200 universities
  metrics.py                Score calculations + percentile ranks

generator/
  guide_generator.py        Compiles analyzed pages → HTML guidebook
```

### Crawl Pipeline

```
[User clicks Discover]
  → discoverer.py: sitemap.xml + shallow homepage scan
  → stores discovered_urls[] in university document
  → user selects/deselects pages in UI

[User clicks Start Crawl]
  → routes.py picks crawl mode from crawl_config.crawl_mode:
    auto      → crawler.py       (Playwright BFS)
    cloudflare → cloudflare_crawler.py (CF API)
    manual    → targeted_crawler.py   (httpx + html2text)
  → pages stored in MongoDB with raw_text + markdown_content
  → status: crawling → pending

[User clicks Start Analysis]
  → analyzer.py: Azure OpenAI function calling per page
  → assigns content_tags, issue_tags, quality_tags, ai_summary, ai_improvements
  → metrics.py: calculates scores + percentiles
  → status: analyzing → completed
```

### Page Document Schema (key fields)
```
url, domain, path, title, ai_title
status: crawled | analyzed | error
depth, parent_url, link_location, navigation_difficulty
page_category, page_subcategory
content_tags[], issue_tags[], quality_tags[]
ai_summary, ai_improvements[]
metrics: { word_count, load_time_ms, readability_score, ... }
raw_text (capped 500k chars)
markdown_content (CF and manual modes, capped 1M chars)
```

---

## Frontend (`frontend/src/`)

```
pages/
  Dashboard.tsx           University list + status cards
  UniversityDetail.tsx    7-tab view: Crawl, Overview, Pages, Tree, Graph, Metrics, Outreach
  PageReport.tsx          Per-page detail
  GuideGenerator.tsx      HTML guidebook view

components/
  layout/
    Layout.tsx            Sidebar + main content
    Sidebar.tsx           Nav with live university status dots
  ui/
    Button, Card, Badge, Input, Modal, Tabs, ...
    ErrorBoundary.tsx     Global + per-route crash protection
  university/
    SiteDiscovery.tsx     URL tree with checkboxes (pre-crawl pruning)
    SiteTree.tsx          Post-crawl tree visualization
    SiteGraph.tsx         Link graph (React Flow)
    PageTable.tsx         Paginated page list with filters
    MetricsCharts.tsx     Score charts (Recharts)
    OutreachTab.tsx       AI cold email generator

lib/
  api.ts                  React Query hooks (auto-polling on active status)
  types.ts                TypeScript types
  utils.ts                Helpers
```

### Data Flow

```
useUniversity(id)
  refetchInterval: 3s when status = crawling | analyzing | discovering

useUniversities()
  refetchInterval: 5s when any university is active
```

---

## Design System

Dark-first enterprise theme. Tokens defined in `index.css` as CSS variables, mapped to Tailwind in `tailwind.config.ts`.

Key tokens:
- `--theme-background`: `#0a0a0a`
- `--theme-primary`: `#06D6A0` (teal)
- `--theme-brand-secondary`: `#9333ea` (purple)
- `--theme-nav-accent`: `#7877FF`

All components use semantic tokens (`bg-card`, `text-foreground`, etc.) — never hardcoded hex.

---

## Architectural Roadmap

### Phase 1 — Current (v2.1)
- [x] Auto Playwright BFS crawler
- [x] Manual URL selection + pruning
- [x] Cloudflare Browser Rendering integration (needs CF credentials)
- [x] URL discovery (sitemap + homepage)
- [x] Markdown content storage
- [x] AI analysis with 150+ tags
- [x] Guide generator
- [x] Outreach email generator
- [x] Live status polling

### Phase 2 — Next
- [ ] **Tag annotations on Markdown** — highlight specific text chunks with issue/content tags, store as `annotations[]` per page. Enables inline "bad text" / "good text" rendering.
- [ ] **Outreach history** — persist generated emails to MongoDB, show list per university
- [ ] **Real-time progress** — WebSocket or SSE for crawl progress (pages crawled count live)
- [ ] **Markdown viewer** — render stored `markdown_content` in Page detail with tag highlights

### Phase 3 — Scale
- [ ] **Message queue** — Redis + Celery for crawl/analysis jobs (prevents FastAPI timeout issues at scale)
- [ ] **Competitor database** — bulk pre-crawl top-500 universities, cache benchmarks
- [ ] **PDF export** — audit report as branded PDF
- [ ] **Multi-user** — auth + per-user university isolation

---

## Known Constraints

| Constraint | Detail |
|------------|--------|
| Azure OpenAI | `max_completion_tokens` only, no `temperature`, no `api-version` query param |
| Cloudflare crawl | Requires Workers Paid plan + Browser Rendering API enabled |
| Playwright on VM | ~200–400MB RAM per crawl — avoid running multiple concurrent auto-crawls |
| Vercel rewrites | `vercel.json` → Nginx → FastAPI. Never bypass. |
