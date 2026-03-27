# Architecture Review & Best Practices (2026)

Building an AI-powered scraping SaaS (Software as a Service) is notoriously difficult because it combines three highly unstable domains:
1. **Web Scraping:** Websites change, bot protection (Cloudflare) blocks requests, and headless browsers (Playwright) consume massive amounts of RAM/CPU.
2. **LLM/AI APIs:** Third-party APIs (like Azure OpenAI) are subject to rate limits, timeouts, and unpredictable response times.
3. **Serverless Frontends:** Platforms like Vercel expect APIs to respond within milliseconds. If an API takes 2 minutes to scrape a site and analyze it, the connection will drop (Timeout).

Here is a breakdown of common pitfalls we encountered and how enterprise applications solve them.

## 1. The "Timeout & Slow Response" Problem

**The Mistake:** Making synchronous API calls. 
When the React frontend asks the backend "Analyze University X", the backend starts Playwright, scrapes 50 pages, sends them to OpenAI, and waits for a response. This takes 5+ minutes. Vercel will kill the connection after 10-60 seconds (giving a 504 Gateway Timeout).

**The Best Practice (Asynchronous Workers):**
*   **Message Queues:** Use a message broker like Redis + Celery, RabbitMQ, or AWS SQS.
*   **Workflow:**
    1. Frontend sends a request: `POST /api/analyze { url: "..." }`
    2. Backend saves a job to the database with status `PENDING` and immediately returns `{ job_id: 123 }`.
    3. A separate worker process (running in the background on the VM) picks up the job, runs Playwright, calls OpenAI, and updates the DB to `COMPLETED`.
    4. Frontend polls `GET /api/jobs/123` or uses WebSockets to show a progress bar to the user until it's done.

## 2. The "Mixed Content & CORS" Problem

**The Mistake:** Connecting a secure HTTPS frontend (like `https://uni-audit.vercel.app`) directly to an insecure HTTP backend (like `http://20.240.202.14:8000`).
Modern browsers block this entirely for security reasons (Mixed Content). If you try to fix it by adding CORS headers to the Python backend, it still won't work because of the HTTP/HTTPS mismatch.

**The Best Practice (Reverse Proxies & Rewrites):**
*   **Reverse Proxy:** We installed Nginx on the Azure VM. Nginx listens on port 80 and securely routes traffic to the Python backend on port 8000. 
*   **Vercel Rewrites:** Instead of the browser making the request directly to the VM, we configured Vercel's Edge Network to make the request on our behalf. `vercel.json` rewrites `/api/*` to our VM's IP. The browser only talks to Vercel (HTTPS), and Vercel talks to our VM.

## 3. The "Bot Protection & RAM" Problem

**The Mistake:** Running Playwright locally on the same VM as the web server. 
Headless browsers leak memory. Opening 50 tabs on a university website will crash a standard VM (OOM - Out of Memory). Furthermore, sites like Cloudflare will detect the datacenter IP and block the crawler.

**The Best Practice (Scraping Infrastructure):**
*   **Headless Browser APIs:** Instead of running Playwright on the backend, enterprise apps use services like Browserless.io, ScrapingBee, or Apify. These handle residential proxies, captchas, and browser management.
*   **DOM Extraction:** Instead of passing raw HTML to the LLM (which eats up millions of tokens and costs a fortune), extract only the text or use markdown converters (like `html2text` or Mozilla's Readability) before sending it to the AI.

## 4. The "Configuration & Environment" Problem

**The Mistake:** Hardcoding IP addresses and API keys in the code (`VITE_API_URL=http://...`).
When you deploy to Vercel, the code tries to hit the hardcoded IP, but forgets about the production proxy rules.

**The Best Practice (12-Factor App):**
*   Never commit `.env` files.
*   Use environment-aware routing. In our `api.ts`, we now check `import.meta.env.DEV`. If we are coding locally, it hits `localhost:8000`. If we are in production, it uses relative paths (`/api/...`) so the hosting provider (Vercel) can handle the routing via `vercel.json`.

## Summary of Our Current Architecture

We have successfully transitioned to a more stable architecture:
1. **Frontend:** React/Vite hosted on Vercel. Fast, serverless, and secure.
2. **Routing:** Vercel Rewrites securely tunnel API requests to our Azure VM.
3. **Gateway:** Nginx on the Azure VM handles incoming traffic on port 80 and proxies it to the Python app.
4. **Backend:** FastAPI/Uvicorn running as a daemon service (systemd) on port 8000, ensuring it restarts automatically if it crashes.
5. **Database:** MongoDB Atlas (Cloud) storing the parsed data.

To scale further, the next major step would be implementing a **Message Queue (Redis/Celery)** for the scraper.
