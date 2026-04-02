# UniAudit

AI-powered platform for auditing university admission websites.
Business model: cold-pitch universities with a free audit report, then sell consulting.

---

## Stack

| Layer | Tech |
|-------|------|
| Backend | Python 3.12, FastAPI, Motor (async), Playwright, httpx, html2text |
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, Recharts |
| Database | MongoDB Atlas |
| AI | Azure OpenAI `gpt-5.4-nano` |
| Deploy | Vercel (frontend) · Azure VM OpenClaw (backend via Nginx) |

---

## Local Development

### Backend
```bash
cd backend
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
playwright install chromium
cp .env.example .env   # fill in secrets
./start-dev.sh
# → http://localhost:8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173 (proxies /api to localhost:8000)
```

### Environment variables (backend `.env`)
```env
MONGODB_URI=...
AZURE_OPENAI_ENDPOINT=...
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_MODEL=gpt-5.4-nano

# Optional — enables Cloudflare crawl mode
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
```

---

## Production Deployment

Frontend deploys automatically via GitHub Actions on push to `main`.
Backend runs as a systemd service on the Azure VM.

**Routing:** Vercel rewrites `/api/*` → `http://<VM_IP>/api/*` via `vercel.json`.
Never change `api.ts` API_URL logic or `vercel.json` — it's what makes HTTPS→HTTP work.

---

## Crawl Modes

UniAudit supports three crawl strategies per university:

| Mode | Engine | Best for |
|------|--------|----------|
| `auto` | Playwright BFS | SPAs, dynamic JS, unknown site structure |
| `cloudflare` | CF Browser Rendering API | Clean Markdown output, JS rendering without running Playwright on VM |
| `manual` | httpx + html2text | You know exactly which pages to audit, fastest |

**Manual pruning flow:**
1. Open university → **Crawl** tab
2. Click **Discover URLs** — scans sitemap.xml + homepage links (no browser, ~5–10s)
3. Uncheck pages you don't need (news, calendar, portal, etc.)
4. Optionally add specific URLs manually
5. Click **Start Crawl**

---

## API Endpoints

```
POST   /api/universities                        create
GET    /api/universities                        list
GET    /api/universities/{id}                   get
DELETE /api/universities/{id}                   delete

POST   /api/universities/{id}/discover          URL discovery (pre-crawl)
PUT    /api/universities/{id}/crawl-config      update crawl mode/urls/excludes
POST   /api/universities/{id}/crawl             start crawl (background)
POST   /api/universities/{id}/analyze           start AI analysis (background)
GET    /api/universities/{id}/status            crawl/analysis status
GET    /api/universities/{id}/crawl-status      detailed crawl progress + mode info

GET    /api/universities/{id}/pages             paginated, filterable
GET    /api/universities/{id}/pages/{page_id}   single page detail
POST   /api/universities/{id}/pages/manual      fetch specific URLs immediately

GET    /api/universities/{id}/tree              site tree (for Tree tab)
GET    /api/universities/{id}/graph             link graph (for Graph tab)
GET    /api/universities/{id}/metrics           score metrics

POST   /api/universities/{id}/generate-guide    compile HTML guidebook
GET    /api/universities/{id}/guide             get generated guide
POST   /api/universities/{id}/generate-outreach AI cold email generator
```
