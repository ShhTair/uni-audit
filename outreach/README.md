# UniAudit Outreach Toolkit

A complete outreach automation system for turning UniAudit findings into paid consulting engagements. Analyze a university's admission website, then use this toolkit to send personalized, data-driven cold outreach to the right decision-makers.

---

## Prerequisites

**Python 3.11+** with the following packages (install via `pip install -r scripts/requirements.txt`):

```
httpx
openai
python-dotenv
pyyaml
jinja2
beautifulsoup4
```

**Email sending** — choose one:
- **SMTP** (Gmail app password, Outlook, or any SMTP relay) — built-in support
- **SendGrid** — set `SENDGRID_API_KEY` in your `.env` and use the SendGrid sender class
- **Lemlist** — export generated `.txt` email files and import them as a campaign

**Azure OpenAI** — required for `generate_email.py` to write personalized copy from audit data. Set `AZURE_OPENAI_ENDPOINT` and `AZURE_OPENAI_API_KEY` in your `.env`.

**UniAudit API** — the backend must be running (locally or on your VM) so `generate_email.py` can pull live audit data. Default: `http://localhost:8000`.

---

## Directory Structure

```
outreach/
├── README.md                      ← This file
├── config.yaml                    ← SMTP, sender info, timing settings
├── config.example.env             ← Template for secrets (copy to .env)
├── generate_email.py              ← Main script: audit data → email sequence
├── find_targets.py                ← Find & score universities to target
├── templates/
│   ├── email_sequence.md          ← Full 5-email copywriting templates
│   ├── linkedin_dm.md             ← LinkedIn DM scripts by role
│   ├── initial_outreach.html      ← Jinja2 HTML email: Day 1
│   ├── followup_1.html            ← Jinja2 HTML email: Day 4
│   ├── followup_2.html            ← Jinja2 HTML email: Day 11
│   └── value_bomb.html            ← Jinja2 HTML email: alternative value-add
└── output/
    └── {university-slug}/
        ├── email_1_cold_intro.txt
        ├── email_2_metric_hook.txt
        ├── email_3_value_tip.txt
        ├── email_4_last_attempt.txt
        ├── email_5_breakup.txt
        └── linkedin_dm.txt
```

---

## Core Workflow

### Step 1 — Find & Score Targets

Run `find_targets.py` to get a prioritized list of universities worth auditing and contacting:

```bash
# Use the built-in starter list (50+ universities)
python find_targets.py --output targets.csv

# Scrape contact emails from specific domains
python find_targets.py --domain northumbria.ac.uk --find-contacts
```

The script outputs a CSV with: university name, domain, estimated contact email, country, tier, and a priority score. Sort by priority and start with mid-tier universities (score 30–70) — they're most likely to respond.

### Step 2 — Audit the University

In the UniAudit web app (or via API):

1. Add the university: `POST /api/universities`
2. Start the crawl: `POST /api/universities/{id}/crawl`
3. Run analysis: `POST /api/universities/{id}/analyze`
4. Note the university ID from the response — you'll need it next.

```bash
# Quick one-liner to add and start a crawl
curl -X POST http://localhost:8000/api/universities \
  -H "Content-Type: application/json" \
  -d '{"name":"Northumbria University","domains":["northumbria.ac.uk"],"country":"UK"}'
```

### Step 3 — Generate the Email Sequence

```bash
python generate_email.py \
  --university-id 664a1f3b2c8d9e0012345678 \
  --contact-name "Sarah Mitchell" \
  --contact-email "s.mitchell@northumbria.ac.uk" \
  --api-url http://localhost:8000
```

This will:
- Fetch the audit summary and top issues from the UniAudit API
- Use Azure OpenAI to write personalized, specific copy for each email
- Save 5 email `.txt` files and a LinkedIn DM to `output/northumbria-university/`

Optional flags:
```bash
--send          # Send Email 1 immediately via SMTP (requires config.yaml)
--dry-run       # Print emails to stdout without saving or sending
--from-json audit_export.json  # Use a JSON file instead of the live API
```

### Step 4 — Review & Customize

Open the generated files in `output/{slug}/`. Each email has a recommended subject line at the top. Before sending:

- Verify the specific issues mentioned are accurate
- Personalize the opening line if you know anything about the contact
- Check the university name renders correctly (no "University of X" vs "X University" mix-ups)
- Add a real calendar link to the follow-up emails

### Step 5 — Send

**Single email via SMTP:**
```bash
python scripts/email_sender.py \
  --file output/northumbria-university/email_1_cold_intro.txt \
  --to s.mitchell@northumbria.ac.uk \
  --dry-run   # remove this flag to actually send
```

**Full sequence with delays:**
```bash
python scripts/email_sender.py \
  --directory output/northumbria-university/ \
  --to s.mitchell@northumbria.ac.uk \
  --schedule   # queues emails per the day offsets in config.yaml
```

**Bulk via Lemlist / Instantly.ai:**
Export the `output/` directory and import the plain-text files as a campaign template. Map `{{variables}}` to your campaign's custom fields.

---

## Email Sequence Overview

| # | File | Timing | Hook |
|---|------|--------|------|
| 1 | `email_1_cold_intro.txt` | Day 1 | Audit score + top issue |
| 2 | `email_2_metric_hook.txt` | Day 3 | One damning specific metric |
| 3 | `email_3_value_tip.txt` | Day 7 | Free actionable mini-tip |
| 4 | `email_4_last_attempt.txt` | Day 14 | Closing the loop |
| 5 | `email_5_breakup.txt` | Day 21 | Breakup / permission to say no |

See `templates/email_sequence.md` for full copywriting templates with subject line variations, PS lines, and personalization notes.

---

## Tips for Effective Cold Outreach to Universities

**Target the right person.** Admission Directors and VP/Directors of Enrollment own the problem. Web/IT Directors are gatekeepers — useful cc's, but rarely the economic buyer. Marketing Directors are good alternatives if the admission director is unreachable.

**Lead with specificity.** "Your admission pages scored 41/100" lands infinitely better than "I found some issues with your website." The audit data is your unfair advantage — use it.

**Mid-tier universities are your sweet spot.** Schools ranked 100–500 nationally feel competitive pressure but lack the internal resources to fix UX problems themselves. They're more likely to respond than Ivy-adjacent schools with full marketing teams.

**Avoid peak admission season.** Outreach sent during November–January (peak application season) will be ignored. Best windows: February–April and June–September.

**Personalize the first line every time.** Even a single sentence that references something specific about the university ("I noticed your MBA admission page doesn't list tuition until step 3 of the application flow...") dramatically lifts reply rates.

**Follow up exactly 3 times.** Research consistently shows that 70%+ of replies to cold email come from follow-ups 2 and 3. Send all 5 emails in the sequence.

**Keep HTML emails for the cold intro only.** Follow-up emails (2–5) should be plain text — they look like a real person wrote them and get past spam filters far more reliably.

**Use a personal domain.** Sending from `tair@uni-audit.com` is fine, but `tair@taircohen.com` or similar personal domains have better deliverability for cold outreach. Warm up the domain with a tool like Instantly or Mailwarm before sending at volume.

**Track opens and clicks sparingly.** Open tracking pixels can trigger spam filters. Use click tracking on the "View Your Report" link only — that's the signal that matters.

---

## Configuration Reference

Copy `config.example.env` to `.env` and fill in your credentials. The `config.yaml` file controls sender metadata and timing — edit it directly.

Key `config.yaml` settings:

```yaml
outreach:
  delay_between_emails_seconds: 60   # Delay between sends in a batch
  followup_1_days: 3                 # Days after Email 1 to send Email 2
  followup_2_days: 7                 # Days after Email 1 to send Email 3
  max_emails_per_day: 30             # Hard cap to protect deliverability
```

---

## Troubleshooting

**"No summary data found"** — The university hasn't been fully analyzed yet. Check status via `GET /api/universities/{id}/status`.

**Azure OpenAI errors** — Verify your endpoint URL includes the deployment name. The script expects `AZURE_OPENAI_DEPLOYMENT` in `.env` (default: `gpt-4o`).

**Emails going to spam** — Ensure SPF/DKIM records are set on your sending domain. For Gmail SMTP, use an app password (not your main password). Consider a dedicated sending domain warmed up over 2–3 weeks.

**`generate_email.py` hangs** — The UniAudit backend may still be analyzing pages. Wait for status `completed` before generating outreach.
