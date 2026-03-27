# UniAudit Agent

A comprehensive web-scraping and AI-powered analysis tool designed to audit university websites. It focuses on evaluating the availability and quality of information critical to prospective students, such as admissions, tuition fees, and international student support.

## Architecture & Technology Stack

The application is split into two main components:

### 1. Backend (Python / FastAPI)
- **Data Collection:** Uses Playwright (via `playwright-stealth`) to crawl university websites, bypassing bot protection (like Cloudflare and GFW).
- **Data Analysis:** Integrates with Azure OpenAI (`gpt-5.4-nano`) to analyze the scraped content, looking for missing information, structural issues, and calculating a score based on a proprietary rubric.
- **Database:** MongoDB Atlas is used to store university profiles, raw page data, and generated reports.
- **API:** Exposes a FastAPI application that serves the processed data to the frontend.

### 2. Frontend (React / Vite / Vercel)
- **Framework:** React with Vite.
- **Styling:** Tailwind CSS with a custom design system based on `shadcn/ui` (specifically ported from the `Clawforge` project, featuring a dark, premium aesthetic).
- **Data Fetching:** `@tanstack/react-query` for state management and caching.
- **Deployment:** Hosted on Vercel.

## Network & Deployment Architecture

To ensure the Vercel frontend can communicate with the Azure-hosted backend:
1. The backend runs on port `8000`.
2. An `nginx` reverse proxy listens on port `80` (HTTP) and forwards requests to `localhost:8000/api/`.
3. The Azure Network Security Group (NSG) allows inbound traffic on port `80`.
4. Vercel's `vercel.json` rewrites requests from `/api/*` to `http://<AZURE_VM_IP>/uni-api/*`.

## Local Development Setup

### Backend
1. Create a `.env.local` file with the required credentials:
   ```env
   MONGODB_URI="..."
   AZURE_OPENAI_ENDPOINT="..."
   AZURE_OPENAI_API_KEY="..."
   AZURE_OPENAI_MODEL="gpt-5.4-nano"
   ```
2. Set up a virtual environment and install dependencies:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   playwright install chromium
   ```
3. Run the backend:
   ```bash
   bash start-dev.sh
   ```

### Frontend
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server (uses Vite proxy to forward API requests to `localhost:8000`):
   ```bash
   npm run dev
   ```

## Production Deployment (Vercel)

The frontend is deployed on Vercel. To deploy changes:
```bash
cd frontend
vercel --prod --yes
```
Note: Ensure `VITE_API_URL` is NOT hardcoded in production to avoid Mixed Content errors. Vercel rewrites handle the API routing.
