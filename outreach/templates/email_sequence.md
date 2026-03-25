# UniAudit Email Sequence — 5-Email Cold Outreach Templates

Full copywriting templates for converting audit findings into consulting conversations.
Variables wrapped in `{{double_braces}}` are replaced by `generate_email.py`.

**Variables reference:**
- `{{uni_name}}` — University full name (e.g., "Northumbria University")
- `{{contact_name}}` — First name of recipient (e.g., "Sarah")
- `{{overall_score}}` — Numeric audit score out of 100 (e.g., "41")
- `{{top_issue}}` — Single most critical issue, plain English (e.g., "no tuition fee information on the main application page")
- `{{pages_analyzed}}` — Number of pages included in audit (e.g., "47")
- `{{critical_issues_count}}` — Number of critical-severity issues found (e.g., "8")
- `{{missing_sections}}` — Comma-separated list of missing guide sections (e.g., "scholarships, visa requirements, housing deadlines")
- `{{your_name}}` — Your name (from config.yaml sender.name)
- `{{report_url}}` — Full URL to the public audit report
- `{{calendar_link}}` — Calendly or scheduling link
- `{{specific_metric}}` — AI-generated one-line damning metric for Email 2
- `{{free_tip_issue}}` — The specific issue used as the free tip in Email 3
- `{{free_tip_fix}}` — The concrete fix for that issue
- `{{competitor_name}}` — A peer institution (AI-generated) for Email 4

---

## Email 1 — Cold Intro (Day 1)

*Goal: Get them to click the report link. Curiosity + specificity.*
*Format: HTML (use `initial_outreach.html` template) or plain text below.*
*Send to: Admission Director, VP Enrollment, or Marketing Director.*

### Subject Lines (A/B test — pick one)

- **A:** I audited {{uni_name}}'s admission pages — here's what I found ({{overall_score}}/100)
- **B:** {{uni_name}} admission website: {{critical_issues_count}} issues hurting your applicant pipeline
- **C:** Quick question about {{uni_name}}'s international student pages

### Body

```
Hi {{contact_name}},

I run a service called UniAudit — we analyze university admission websites
to find gaps that could be costing you prospective applicants.

Last week I ran an audit of {{uni_name}}'s admission pages ({{pages_analyzed}} pages
analyzed). The overall score came back at {{overall_score}}/100.

The most significant finding: {{top_issue}}.

I also found {{critical_issues_count}} other critical issues across areas like content
completeness, navigation clarity, and mobile experience — including missing
information on {{missing_sections}}.

I've put together a full report with specific recommendations. It's yours, free:

{{report_url}}

No pitch, no catch — just the data. If any of it is useful and you'd like
to talk through the findings, I'd be happy to do a 15-minute call.

Best,
{{your_name}}
```

### PS Line

```
P.S. The report also flags which of your pages prospective students are most
likely to abandon — worth a look even if you don't want to chat.
```

### Personalization Notes

- If you know the contact manages a specific program (MBA, international, etc.), tailor `{{top_issue}}` to something that affects that program's pages specifically.
- For VP Enrollment, open with enrollment/conversion language ("costing you applicants") rather than technical UX language.
- For Marketing Directors, frame around brand perception and competitor positioning.
- Keep the plain-text version under 200 words. The HTML template handles visual layout — don't pad the text.

---

## Email 2 — Metric Hook Follow-Up (Day 3)

*Goal: Re-engage with one specific, concrete finding they can verify themselves.*
*Format: Plain text only — feels more personal.*
*Send as a reply to Email 1 thread.*

### Subject Lines

- **A:** Re: {{uni_name}} audit — one number I wanted to flag
- **B:** The {{uni_name}} finding that surprised me most
- **C:** (reply in same thread — no new subject needed)

### Body

```
Hi {{contact_name}},

Following up on the audit I sent over — wanted to highlight one finding
specifically:

{{specific_metric}}

I checked a handful of peer institutions and this is unusual. Most
comparable universities surface this information within 2 clicks of
the main admission landing page.

It's the kind of thing that doesn't show up in your analytics directly,
but it does show up in application drop-off rates.

The full report is still at {{report_url}} if you'd like the complete picture.

Happy to walk through the top 3 fixes in a quick call — no obligation.

{{your_name}}
```

### PS Line

```
P.S. If now isn't the right time, I'm happy to follow up in a month or two.
Just let me know.
```

### Personalization Notes

- `{{specific_metric}}` should be highly concrete: e.g., "Your international application deadlines page has 847 words but no dates visible above the fold — a prospective student would have to scroll through 4 sections to find the actual deadline."
- Do not repeat the overall score. The score was Email 1's hook — this email is about depth, not breadth.
- Keep it under 150 words. Shorter = more credible. This should read like a colleague flagging something, not a sales email.
- If you have access to the actual page URL where the issue lives, include it as a plain link (no anchor text). Showing them exactly where the problem is makes ignoring it harder.

---

## Email 3 — Value-Add / Free Tip (Day 7)

*Goal: Give real value with no strings attached. Reframe you as an expert, not a vendor.*
*Format: Plain text. Short.*

### Subject Lines

- **A:** A free fix for {{uni_name}}'s admission page (takes 10 minutes)
- **B:** One quick win for {{uni_name}} — no consulting required
- **C:** Thought you'd find this useful, {{contact_name}}

### Body

```
Hi {{contact_name}},

I know you've probably got a full inbox, so I'll keep this to one
actionable thing.

Issue I found on {{uni_name}}'s admission pages:
{{free_tip_issue}}

The fix:
{{free_tip_fix}}

This alone typically reduces bounce rate on application pages by 15–25%
based on what we've seen across other institutions. And it doesn't require
any dev work — just a content update.

There are 11 more recommendations in the full report ({{report_url}}), ranging
from 10-minute content fixes to deeper structural improvements.

If you'd like to go through them together, I'm offering a free 20-minute
walkthrough this week — just reply and we'll find a time.

{{your_name}}
```

### PS Line

```
P.S. If someone else on your team handles the website, feel free to forward
this along. Happy to loop them in directly.
```

### Personalization Notes

- The free tip should be genuinely useful — a real fix someone could implement tomorrow. Not a teaser or a cliff-hanger. Give away the fix completely.
- Good examples of `{{free_tip_issue}}` and `{{free_tip_fix}}`:
  - Issue: "The application requirements page mixes domestic and international requirements on the same page with no filtering option." Fix: "Add a simple 'I am a...' toggle (Domestic / International) at the top of the page. This is a native HTML radio button — no JavaScript library needed."
  - Issue: "Your FAQ page has 34 questions with no search or categorization." Fix: "Group questions into 4 categories (Applying, Finances, Visas, Campus Life) with anchor links at the top. Students can jump directly to what they need."
- The 15–25% bounce rate reduction claim should only be included if you have data to back it up. If you don't, replace with "makes it significantly easier for prospective students to take the next step."

---

## Email 4 — Last Attempt / Closing the Loop (Day 14)

*Goal: One more genuine attempt before the breakup email. Introduce FOMO / peer pressure.*
*Format: Plain text.*

### Subject Lines

- **A:** Closing the loop on the {{uni_name}} audit
- **B:** Last note on this — wanted to make sure it reached you
- **C:** {{uni_name}} + a competitor insight I wanted to share

### Body

```
Hi {{contact_name}},

I've sent a few notes about the audit of {{uni_name}}'s admission pages and
I don't want to keep filling your inbox if it's not relevant right now.

One last thing worth mentioning: {{competitor_name}} recently updated their
international admissions pages in a way that addresses several of the same
gaps I flagged for {{uni_name}}. In a competitive recruitment environment,
that kind of gap tends to compound over time.

Your full report is still live: {{report_url}}

If you'd like to talk through it, my calendar is here: {{calendar_link}}

If now isn't the right time, no worries at all — I'll stop following up.
Just reply with "not now" and I'll check back in 6 months.

{{your_name}}
```

### PS Line

```
P.S. If you're not the right person for this, I'd genuinely appreciate a
pointer to who is — happy to reach out to them directly.
```

### Personalization Notes

- `{{competitor_name}}` should be a real, closely ranked peer institution in the same country or region — not a top-20 school (that would feel irrelevant). Use the university's own peer group if you know it (e.g., other Russell Group schools, other AAU members, other regional state universities).
- The "not now / check back in 6 months" offer is important. It keeps the door open and reduces friction to reply. Some of your best leads will be people who say "not now" and then become clients 6 months later.
- Do NOT add a new audit finding in this email. If they haven't responded to three emails with audit data, more data won't move them. The competitor angle is the only new hook worth introducing at this stage.

---

## Email 5 — Breakup Email (Day 21)

*Goal: Get a response — even a "no" is valuable. Clear the list.*
*Format: Plain text. Very short. Disarming.*

### Subject Lines

- **A:** Should I stop sending these?
- **B:** Closing my file on {{uni_name}}
- **C:** It's okay to say no

### Body

```
Hi {{contact_name}},

I've shared a few notes about {{uni_name}}'s admission pages over the past
few weeks. I haven't heard back, which usually means one of three things:

1. Not the right time
2. Not the right person (I may have the wrong contact)
3. Not relevant at all

Any of those is completely fine — I just want to make sure I'm not sending
emails to an inbox where they're not useful.

If you're open to it, a one-word reply ("later", "wrong person", or "stop")
helps me a lot. But no obligation.

Either way, I won't follow up again after this.

{{your_name}}
```

### PS Line

```
P.S. The audit report for {{uni_name}} stays live at {{report_url}} — feel
free to share it with your team whenever it's useful.
```

### Personalization Notes

- This email should be the shortest of the five. Anything over 100 words dilutes the effect.
- Do NOT include audit data, links to book a call, or a pitch of any kind. The only CTA is "reply with one word." The disarming tone is what generates responses.
- The numbered list of reasons is intentional and tested — it signals that you understand their situation and reduces the social cost of ignoring your emails.
- Expect a 5–15% response rate on this email specifically, even from a cold list with no prior engagement. Many of those responses will be "wrong person — try X" which are leads.
- After this email: remove non-responders from your active sequence. You can re-engage in 6 months with fresh audit data if the university hasn't visibly improved.

---

## Sequence Timing Summary

```
Day 1:  Email 1 — Cold Intro (HTML)
Day 3:  Email 2 — Metric Hook (plain text, reply thread)
Day 7:  Email 3 — Free Tip (plain text, new thread)
Day 14: Email 4 — Last Attempt (plain text, new thread)
Day 21: Email 5 — Breakup (plain text, new thread)
```

Stop the sequence immediately if:
- The contact replies (even negatively)
- The contact books a call
- You receive an out-of-office indicating they're on extended leave (pause, resume when they return)
- You receive a bounce (update your contact list)

---

## Subject Line A/B Testing Guidance

Run at least 50 sends before judging a subject line. Track:
- Open rate (>40% is good for cold outreach)
- Reply rate (>2% is good; >5% is excellent)
- Positive reply rate (replies that aren't "unsubscribe")

High-performing patterns for university outreach:
- Specificity beats cleverness ("41/100" beats "Your website has problems")
- Questions outperform statements in follow-ups ("Should I stop?" beats "Final note")
- Their university name in the subject line adds 8–15% open rate lift
- Numbers in subjects outperform vague claims
