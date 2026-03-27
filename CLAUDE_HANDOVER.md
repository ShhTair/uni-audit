# 🤖 HANDOVER FOR CLAUDE CODE

Hello, Claude! I am the cloud instance of OpenClaw. I've been working on this project (UniAudit) but the user has requested that I hand over the context to you so you can continue the work locally.

Here is the exact state of the project, what has been done, and what you need to focus on next.

---

## 1. Project Context: UniAudit v2.0
We pivoted from a heavy "React Flow" node-based canvas to a sleek, **Data-First B2B Dashboard**. 
The goal is to crawl university websites (Admissions/International sections), analyze them with Azure OpenAI (`gpt-5.4-nano`), and present a high-end audit report to University Deans.

### Tech Stack
- **Backend:** Python FastAPI, MongoDB Atlas, Playwright (Stealth), Azure OpenAI.
- **Frontend:** React, Vite, Tailwind CSS, Shadcn UI, Recharts.
- **Hosting:** Vercel (Frontend), Azure VM (Backend via Nginx proxy).

---

## 2. What I Have Already Done (The Foundation)

### ✅ API & Routing (Mixed Content Fix)
Vercel is HTTPS, but our Azure VM backend is HTTP (`http://20.240.202.14:8000`). Direct calls failed due to Mixed Content. 
**My Fix:** 
- I configured `vercel.json` to act as a reverse proxy: `source: "/api/:match*", destination: "http://20.240.202.14:8000/api/:match*"`.
- I updated `frontend/src/lib/api.ts`. In production (`import.meta.env.DEV === false`), `API_URL` is an empty string `""`, forcing the browser to hit relative paths (`/api/universities`), which Vercel safely tunnels to the backend.

### ✅ "Clawforge" Design System Port
The user wanted the exact aesthetic from their `ShhTair/clawforge` repository (a mix of Mintlify and GitHub: deep dark mode, `#09090b` backgrounds, `#24b47e` accents, `#27272a` borders).
**My Fix:** 
- Ported `tailwind.config.ts` and `src/index.css` (CSS variables).
- Ported premium components: `PageHeader`, `PageTabs`, `GeometricPattern`, `Breadcrumbs`.
- Cleaned up old `bg-white`, `bg-gray-100`, `shadow-md` classes across `Button`, `Card`, `Modal`, `SiteGraph` and replaced them with semantic tokens (`bg-background`, `bg-card`, `border-border`).

---

## 3. Your Mission (What needs fixing/building NEXT)

The foundation is solid, and the API works, but the user is not satisfied with the visual outcome yet. They noted: *"почему вообще так много ошибок и долгие решения... апдейтни документацию в репо"* and *"найди какие потенциальные проблемы могут быть и как вообще правильно делать такую аппку"*.

Here are your primary objectives:

### 🎯 Objective 1: Polish the UI / Fix "Ugly" Layouts
I did a massive regex find-and-replace to enforce the Clawforge colors, but some pages still look disjointed or "ugly" (the user's words). 
- **Action:** Open the main pages (`Dashboard.tsx`, `UniversityDetail.tsx`, `PageTable.tsx`). Review how the `PageHeader` and `GeometricPattern` are used inside the main `Layout.tsx`. Ensure the padding, margins, and card grids look like a premium $10k B2B SaaS, not a hacked-together template.

### 🎯 Objective 2: Review `Brandbook.tsx`
The user mentioned the Brandbook page is still opening a "blank black screen" or crashing. I previously restored the original Clawforge `Brandbook.tsx` and `PlaygroundPage.tsx`, but they might still have missing dependencies or broken imports.
- **Action:** Check `frontend/src/pages/Brandbook.tsx`. Ensure it compiles. If it uses missing components (like `ChatFAB` or stores), mock them safely or remove them. The user wants the Brandbook as a visual reference for the design system.

### 🎯 Objective 3: Implement B2B Outreach Generator
The user wants to sell this tool to universities. We have an analyzed university (University of Nottingham) in the DB.
- **Action:** Create a feature (maybe a tab in `UniversityDetail.tsx` or a modal) that takes the `summary` data (content gaps, critical issues) and uses the LLM to generate a **Cold Email Pitch** to the Dean of Admissions.

### 🎯 Objective 4: Add Error Boundaries & Fallbacks
The user is tired of React crashing (`Minified React error #130`). 
- **Action:** Implement a global React `ErrorBoundary` in `App.tsx` or `Layout.tsx` so that if one component fails, the whole app doesn't go to a blank white/black screen, but instead shows a sleek "Widget Failed to Load" UI.

---

### ⚠️ Critical Rules for You:
1. **Never break `api.ts` or `vercel.json`:** The routing is delicate. Leave the proxy logic alone.
2. **Stick to the Theme:** Only use `bg-background`, `bg-card`, `border-border`, `text-primary`, `text-muted-foreground`. Do not hardcode HEX colors in components.
3. **Use Subagents (if you can):** The user loves parallel execution. If you need to do heavy refactoring, spawn subagents or break the work into small, atomic commits.

Good luck!
