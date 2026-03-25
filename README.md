# UniAudit — University Admission Website Intelligence Platform

AI-powered platform that analyzes university admission websites and generates comprehensive audit reports, enabling targeted consulting outreach.

## Architecture

```
uni-audit/
├── backend/          # Python FastAPI + Playwright crawler + Azure OpenAI
├── frontend/         # React + Vite + Tailwind + Framer Motion
├── outreach/         # Cold outreach automation toolkit
└── .github/          # CI/CD workflows
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, React Flow |
| Backend | Python 3.12, FastAPI, Playwright, Motor (async MongoDB) |
| Database | MongoDB Atlas |
| AI | Azure OpenAI (GPT-5.4 Nano) via Responses API |
| Frontend Hosting | Vercel (auto-deploy from GitHub) |
| Backend Hosting | VM (systemd service or Docker) |

## Quick Start

### Backend

```bash
cd backend
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m playwright install chromium

# Copy and fill in .env
cp ../.env.example .env

./start-dev.sh  # hot reload
# or
./start.sh      # production
```

### Frontend

```bash
cd frontend
npm install
npm run dev     # dev server on :3000
npm run build   # production build
```

### Environment Variables

Create `.env` in project root (see `.env` for all keys):

```
MONGODB_URI=...
AZURE_OPENAI_ENDPOINT=...
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_MODEL=gpt-5.4-nano
DATABASE_NAME=uni_audit
```

## Workflow

1. **Add University** → Dashboard → Add University (enter name, domains, country)
2. **Start Crawl** → University page → Start Crawl (Playwright-based, respects dynamic content)
3. **Start Analysis** → After crawl completes → Start Analysis (AI tags each page)
4. **View Results** → Dashboard → metrics, tree, graph, page-by-page reports
5. **Generate Guide** → University page → Generate Guide (self-contained HTML + PDF)
6. **Outreach** → `outreach/` → generate personalized emails from audit data

## Key Features

- **150+ content tags** across admissions, scholarships, majors, deadlines
- **50+ issue tags** detecting outdated info, vague requirements, missing sections
- **Multi-domain crawl** with depth tracking from each root
- **Dynamic content** handled via Playwright (carousels, tabs, lazy loads)
- **Smart branch pruning** — skips news/alumni/events, focuses on admission
- **Competitor benchmarking** — scores vs top-200 global and regional averages
- **Navigation difficulty scoring** — header vs footer vs main content links
- **Site tree + graph visualization** with filters, depth coloring, category highlighting
- **Admission Guide Generator** — compiles findings into a beautiful branded guidebook + PDF
- **Outreach Toolkit** — personalized email sequences with real audit data

## GitHub Actions Secrets Required

For auto-deploy, add these to GitHub repo secrets:
```
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
VITE_API_URL    # your VM's public IP/URL:8000
```

## Vercel Setup

1. Go to [vercel.com](https://vercel.com) → Import from GitHub → select `uni-audit`
2. Set root directory: `frontend`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add env var: `VITE_API_URL=http://your-backend-url:8000`

## VM Deployment (Backend)

```bash
# As systemd service
sudo nano /etc/systemd/system/uni-audit.service

[Unit]
Description=UniAudit Backend
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/opt/uni-audit/backend
EnvironmentFile=/opt/uni-audit/.env
ExecStart=/opt/uni-audit/backend/start.sh
Restart=on-failure

[Install]
WantedBy=multi-user.target

sudo systemctl enable uni-audit
sudo systemctl start uni-audit
```

## Outreach

See `outreach/README.md` for the complete cold outreach workflow.

```bash
cd outreach
python generate_email.py --university-id <ID> --contact-name "John Smith" \
  --contact-email "admissions@university.edu" --api-url http://localhost:8000
```
