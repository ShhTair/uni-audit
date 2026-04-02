# Claude Code Handover

_Last updated: 2026-04-02 by Claude Sonnet 4.6 (local)_

---

## Project State

UniAudit v2.1 — all core features built and working.
Frontend builds clean (`npm run build` — 0 errors, 0 warnings).
Backend imports verified.

---

## What Was Built (Session 3 — 2026-04-02)

### Backend

| File | What it does |
|------|-------------|
| `crawler/discoverer.py` | Pre-crawl URL discovery: parses sitemap.xml + homepage links (httpx, no Playwright). Fast ~5–10s. |
| `crawler/targeted_crawler.py` | Manual crawl mode: fetches specific URLs via httpx + html2text. Stores `markdown_content`. |
| `crawler/cloudflare_crawler.py` | CF Browser Rendering API integration. Auto-disabled without credentials. |
| `models/university.py` | Added `CrawlConfig.crawl_mode`, `manual_urls`, `user_excluded_urls`; `DiscoveredUrl` type; `discovered_urls[]` on University |
| `api/routes.py` | 4 new endpoints; `_run_crawl` dispatches by `crawl_mode` |
| `requirements.txt` | Added `html2text==2024.2.26` |
| `config.py` | Added optional `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` |

### Frontend

| File | What it does |
|------|-------------|
| `components/university/SiteDiscovery.tsx` | URL tree with checkboxes, 3-mode selector, manual URL input |
| `pages/UniversityDetail.tsx` | Added Crawl tab, delete modal, live status banner, removed "Start Crawl" from header |
| `pages/Dashboard.tsx` | Redesigned cards: score mini-bars, animated status chips, summary stats row |
| `components/layout/Sidebar.tsx` | Cleaner design, status dots + pulse animation for active universities |
| `lib/api.ts` | New hooks: `useDiscoverUrls`, `useUpdateCrawlConfig`, `useAddManualPages`, `useCrawlStatus`. Auto-polling in `useUniversity` + `useUniversities` |
| `lib/types.ts` | New types: `CrawlMode`, `CrawlConfig`, `DiscoveredUrl`, `CrawlStatus`, `DiscoverResult` |

---

## New API Endpoints

```
POST   /api/universities/{id}/discover          URL discovery
PUT    /api/universities/{id}/crawl-config      update crawl settings
POST   /api/universities/{id}/pages/manual      fetch specific URLs now
GET    /api/universities/{id}/crawl-status      detailed progress
```

---

## What's Next (Prioritised)

### 1. Outreach History
Store generated emails in `outreach` MongoDB collection.
Show list of past emails in the Outreach tab per university.
Backend: add `POST /outreach` save + `GET /universities/{id}/outreach` list.

### 2. Markdown Annotations / Tag Highlights
The `markdown_content` field is now stored per page.
Next: add `annotations[]` field — list of `{ start, end, tag, type }` ranges.
AI marks specific text chunks (not just whole-page tags).
Frontend: render markdown with colored inline highlights.

### 3. Real-time Crawl Progress
Currently polling university status every 3s.
Upgrade to SSE: `GET /universities/{id}/crawl-stream` pushes `{ pages_crawled, current_url }`.
Frontend: live counter in the LiveStatusBanner.

### 4. Outreach Delete + Re-generate
Add delete button on saved outreach emails.
Add "Re-generate with different tone" button.

---

## Critical Rules

1. **Never touch `api.ts` proxy logic or `vercel.json`** — HTTPS→HTTP routing is fragile
2. **Theme tokens only** — `bg-background`, `text-foreground`, etc. No hardcoded hex in components
3. **Azure OpenAI** — always `max_completion_tokens`, never `temperature`, never `api-version` param
4. **AI calls** — use `httpx` directly (not openai SDK), see `_call_openai` in `analyzer.py` as reference
5. **Crawl modes** — `auto` = Playwright, `cloudflare` = CF API, `manual` = httpx. Dispatch in `_run_crawl` in routes.py

---

## Deploy Checklist (after code changes)

**Frontend (auto via GitHub Actions on push to main)**
- Push to `main` → Vercel deploys automatically
- If manual: `cd frontend && vercel --prod --yes`

**Backend (on OpenClaw VM)**
```bash
cd ~/uni-audit/backend
git pull
source venv/bin/activate
pip install -r requirements.txt   # if requirements changed
sudo systemctl restart uni-audit  # or: ./start.sh
```

**If adding new env vars** — add to `.env` on VM before restarting.
