#!/usr/bin/env python3
"""
generate_email.py — UniAudit Outreach Email Generator

Fetches audit results from the UniAudit API (or a JSON export), then uses
Azure OpenAI to write a personalized 5-email outreach sequence and a
LinkedIn DM. Output files are saved to output/{university-slug}/.

Usage:
    python generate_email.py \
        --university-id 664a1f3b2c8d9e0012345678 \
        --contact-name "Sarah Mitchell" \
        --contact-email "s.mitchell@northumbria.ac.uk" \
        --api-url http://localhost:8000

    # Read from a JSON export instead of the live API:
    python generate_email.py \
        --from-json audit_export.json \
        --contact-name "Sarah Mitchell" \
        --contact-email "s.mitchell@northumbria.ac.uk"

    # Dry run (print to stdout, don't save):
    python generate_email.py --university-id <id> --contact-name "..." --dry-run

    # Save and immediately send Email 1 via SMTP:
    python generate_email.py --university-id <id> --contact-name "..." \
        --contact-email "..." --send
"""

from __future__ import annotations

import argparse
import json
import os
import re
import smtplib
import sys
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from typing import Any

import httpx
from dotenv import load_dotenv
from openai import AzureOpenAI

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

OUTREACH_DIR = Path(__file__).parent
load_dotenv(OUTREACH_DIR / ".env")
load_dotenv(OUTREACH_DIR.parent / ".env")  # also try repo root

API_URL = os.getenv("UNIAUDIT_API_URL", "http://localhost:8000")
AZURE_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT", "")
AZURE_API_KEY = os.getenv("AZURE_OPENAI_API_KEY", "")
AZURE_DEPLOYMENT = os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4o")
AZURE_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION", "2024-08-01-preview")

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
FROM_NAME = os.getenv("FROM_NAME", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USER)

REPORT_BASE_URL = os.getenv("REPORT_BASE_URL", "https://uni-audit.vercel.app/university")
CALENDAR_LINK = os.getenv("CALENDAR_LINK", "https://calendly.com/your-link")


# ---------------------------------------------------------------------------
# Data fetching
# ---------------------------------------------------------------------------


def fetch_university_data(university_id: str, api_url: str) -> dict[str, Any]:
    """Fetch university summary and top pages from the UniAudit API."""
    base = api_url.rstrip("/")
    with httpx.Client(timeout=30) as client:
        uni_resp = client.get(f"{base}/api/universities/{university_id}")
        uni_resp.raise_for_status()
        uni = uni_resp.json()

        # Also fetch top critical pages for richer context
        pages_resp = client.get(
            f"{base}/api/universities/{university_id}/pages",
            params={
                "issue_tags": "missing_content,broken_navigation,no_deadlines",
                "limit": 10,
                "sort_by": "navigation_difficulty",
                "order": "desc",
            },
        )
        pages = pages_resp.json().get("pages", []) if pages_resp.is_success else []

        metrics_resp = client.get(f"{base}/api/universities/{university_id}/metrics")
        metrics = metrics_resp.json() if metrics_resp.is_success else {}

    return {"university": uni, "pages": pages, "metrics": metrics}


def load_from_json(json_path: str) -> dict[str, Any]:
    """Load audit data from a JSON export file."""
    with open(json_path) as f:
        data = json.load(f)

    # Support both a raw API response or a pre-exported bundle
    if "university" in data:
        return data
    # Assume the file is a single university response
    return {"university": data, "pages": [], "metrics": {}}


# ---------------------------------------------------------------------------
# Data extraction helpers
# ---------------------------------------------------------------------------


def extract_audit_context(data: dict[str, Any]) -> dict[str, Any]:
    """Extract the key facts needed for email generation."""
    uni = data["university"]
    summary = uni.get("summary", {})
    pages = data.get("pages", [])
    metrics = data.get("metrics", {})

    overall_score = round(summary.get("overall_score", 0))
    critical_issues_count = summary.get("critical_issues_count", 0)
    top_issues: list[str] = summary.get("top_issues", [])
    category_scores: dict[str, float] = summary.get("category_scores", {})

    # Build a description of the worst pages for OpenAI context
    worst_pages_desc = []
    for page in pages[:5]:
        desc = (
            f"  - {page.get('url', 'unknown URL')} "
            f"(category: {page.get('page_category', 'unknown')}, "
            f"navigation difficulty: {page.get('navigation_difficulty', 0):.1f}/10, "
            f"issues: {', '.join(page.get('issue_tags', [])[:4])})"
        )
        worst_pages_desc.append(desc)

    # Guide completeness from metrics or summary
    completeness_score = (
        metrics.get("completeness_score")
        or category_scores.get("completeness", 0)
    )
    missing_sections: list[str] = metrics.get("missing_sections", [])

    return {
        "uni_name": uni.get("name", "the university"),
        "uni_slug": uni.get("slug", "university"),
        "domains": uni.get("domains", []),
        "country": uni.get("country", ""),
        "overall_score": overall_score,
        "pages_analyzed": summary.get("total_pages_analyzed", 0),
        "critical_issues_count": critical_issues_count,
        "top_issues": top_issues,
        "category_scores": category_scores,
        "completeness_score": round(completeness_score),
        "missing_sections": missing_sections,
        "worst_pages_desc": "\n".join(worst_pages_desc) if worst_pages_desc else "  (no page-level data available)",
        "report_url": f"{REPORT_BASE_URL}/{uni.get('slug', uni.get('id', ''))}",
    }


# ---------------------------------------------------------------------------
# OpenAI email generation
# ---------------------------------------------------------------------------


def build_system_prompt(ctx: dict[str, Any], your_name: str) -> str:
    missing_str = ", ".join(ctx["missing_sections"][:6]) if ctx["missing_sections"] else "not specified"
    top_issues_str = "\n".join(f"  - {i}" for i in ctx["top_issues"][:5]) if ctx["top_issues"] else "  - not available"

    return f"""You are an expert cold email copywriter for a university admission website consulting service called UniAudit.

Your task is to write a personalized 5-email outreach sequence and a LinkedIn DM based on real audit data.
The sender is {your_name}, a consultant who runs UniAudit.

AUDIT DATA:
- University: {ctx["uni_name"]} ({ctx["country"]})
- Domain(s): {", ".join(ctx["domains"])}
- Overall score: {ctx["overall_score"]}/100
- Pages analyzed: {ctx["pages_analyzed"]}
- Critical issues found: {ctx["critical_issues_count"]}
- Guide completeness: {ctx["completeness_score"]}%
- Missing sections: {missing_str}
- Top issues:
{top_issues_str}
- Worst pages (by navigation difficulty):
{ctx["worst_pages_desc"]}

WRITING GUIDELINES:
- Be specific. Reference exact issues, page types, or scores from the audit data above.
- Write like a human, not a marketing department.
- Never use words like "synergize", "leverage", "paradigm", "holistic", "game-changer".
- Never start a sentence with "I hope this email finds you well."
- Keep emails tight. Emails 1–3 should be under 200 words of body text.
- Emails 4 and 5 should be under 120 words.
- The LinkedIn DM should be under 150 words.
- Every email should have 3 subject line options.
- Include a PS line for emails 1–3.
- Tone: confident, direct, collegial — not pushy or salesy.
- The goal is to get a reply or a calendar booking, not to close a sale in email.

OUTPUT FORMAT:
Return a single JSON object with these keys:
  email_1, email_2, email_3, email_4, email_5, linkedin_dm

Each email object must have:
  subjects: [str, str, str]   (3 subject line options)
  body: str                   (plain text body, use \\n for newlines)
  ps: str                     (PS line, empty string if none)
  notes: str                  (brief personalization note for the sender)

The linkedin_dm object must have:
  body: str                   (plain text DM, under 150 words)
  notes: str                  (brief note on which role to send this to and when)

Use {{{{contact_name}}}} where the recipient's first name goes.
Use {{{{your_name}}}} where the sender's name goes.
Use {{{{report_url}}}} where the report link goes.
Use {{{{calendar_link}}}} where the calendar booking link goes.
Return only the JSON object with no markdown fencing."""


def generate_with_openai(
    ctx: dict[str, Any],
    contact_name: str,
    your_name: str,
) -> dict[str, Any]:
    """Call Azure OpenAI to generate the full email sequence."""
    if not AZURE_ENDPOINT or not AZURE_API_KEY:
        raise EnvironmentError(
            "AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY must be set in your .env file."
        )

    client = AzureOpenAI(
        azure_endpoint=AZURE_ENDPOINT,
        api_key=AZURE_API_KEY,
        api_version=AZURE_API_VERSION,
    )

    system_prompt = build_system_prompt(ctx, your_name)
    user_message = (
        f"Generate the email sequence for {ctx['uni_name']}. "
        f"The recipient's first name is {contact_name}. "
        f"Return only valid JSON."
    )

    response = client.chat.completions.create(
        model=AZURE_DEPLOYMENT,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        temperature=0.7,
        max_tokens=4000,
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content or "{}"
    return json.loads(raw)


# ---------------------------------------------------------------------------
# Fallback template renderer (no OpenAI)
# ---------------------------------------------------------------------------


def render_template_fallback(
    ctx: dict[str, Any],
    contact_name: str,
    your_name: str,
) -> dict[str, Any]:
    """Render basic templates using audit data when OpenAI is not available."""
    top_issue = ctx["top_issues"][0] if ctx["top_issues"] else "missing critical information on key admission pages"
    missing = ", ".join(ctx["missing_sections"][:3]) if ctx["missing_sections"] else "key sections"

    def fill(text: str) -> str:
        return (
            text
            .replace("{{contact_name}}", contact_name)
            .replace("{{uni_name}}", ctx["uni_name"])
            .replace("{{overall_score}}", str(ctx["overall_score"]))
            .replace("{{critical_issues_count}}", str(ctx["critical_issues_count"]))
            .replace("{{pages_analyzed}}", str(ctx["pages_analyzed"]))
            .replace("{{top_issue}}", top_issue)
            .replace("{{missing_sections}}", missing)
            .replace("{{your_name}}", your_name)
            .replace("{{report_url}}", ctx["report_url"])
            .replace("{{calendar_link}}", CALENDAR_LINK)
        )

    e1_body = fill(
        "Hi {{contact_name}},\n\n"
        "I run a service called UniAudit — we analyze university admission websites "
        "to find gaps that could be costing you prospective applicants.\n\n"
        "I recently audited {{uni_name}}'s admission pages ({{pages_analyzed}} pages analyzed). "
        "The overall score came back at {{overall_score}}/100.\n\n"
        "The most significant finding: {{top_issue}}.\n\n"
        "I also found {{critical_issues_count}} critical issues across the site, "
        "including missing information on {{missing_sections}}.\n\n"
        "I've put together a full report — it's yours, free:\n\n"
        "{{report_url}}\n\n"
        "If any of it is useful and you'd like to talk through the findings, "
        "I'd be happy to do a 15-minute call.\n\n"
        "Best,\n{{your_name}}"
    )

    e2_body = fill(
        "Hi {{contact_name}},\n\n"
        "Following up on the audit I sent over. One finding I wanted to highlight:\n\n"
        "{{top_issue}}\n\n"
        "This is the kind of issue that doesn't show up directly in analytics, "
        "but it does show up in application drop-off rates.\n\n"
        "The full report is still at {{report_url}} if you'd like the complete picture.\n\n"
        "Happy to walk through the top fixes in a quick call — no obligation.\n\n"
        "{{your_name}}"
    )

    e3_body = fill(
        "Hi {{contact_name}},\n\n"
        "I know you've got a full inbox, so I'll keep this to one actionable thing.\n\n"
        "One quick win for {{uni_name}}: address {{top_issue}}. "
        "This is typically a content update, not a development project, "
        "and it makes a meaningful difference in how prospective students "
        "navigate the application process.\n\n"
        "There are 11 more recommendations in the full report ({{report_url}}), "
        "ranging from 10-minute content fixes to deeper structural improvements.\n\n"
        "If you'd like to go through them together, happy to do a free 20-minute "
        "walkthrough — just reply and we'll find a time.\n\n"
        "{{your_name}}"
    )

    e4_body = fill(
        "Hi {{contact_name}},\n\n"
        "I've sent a few notes about the audit of {{uni_name}}'s admission pages "
        "and don't want to keep filling your inbox if it's not relevant right now.\n\n"
        "Your full report is still live: {{report_url}}\n\n"
        "If you'd like to talk through it: {{calendar_link}}\n\n"
        "If now isn't the right time, no worries — reply with \"not now\" "
        "and I'll check back in 6 months.\n\n"
        "{{your_name}}"
    )

    e5_body = fill(
        "Hi {{contact_name}},\n\n"
        "I've shared a few notes about {{uni_name}}'s admission pages and "
        "haven't heard back. That's usually fine — just wanted to check "
        "one last time before I stop following up.\n\n"
        "If it's not relevant, a quick \"stop\" reply is all I need. "
        "If I have the wrong contact, any pointer helps.\n\n"
        "Either way, I won't follow up again after this.\n\n"
        "{{your_name}}"
    )

    linkedin_body = fill(
        "Hi [Name],\n\n"
        "I recently audited {{uni_name}}'s admission pages as part of a study "
        "on how universities present themselves to prospective students online.\n\n"
        "The site scored {{overall_score}}/100. The main finding: {{top_issue}}.\n\n"
        "I've put together a short report — happy to share it if you're curious.\n\n"
        "{{your_name}}"
    )

    return {
        "email_1": {
            "subjects": [
                f"I audited {ctx['uni_name']}'s admission pages — here's what I found ({ctx['overall_score']}/100)",
                f"{ctx['uni_name']} admission website: {ctx['critical_issues_count']} issues hurting your applicant pipeline",
                f"Quick question about {ctx['uni_name']}'s international student pages",
            ],
            "body": e1_body,
            "ps": "P.S. The report also flags which pages prospective students are most likely to abandon — worth a look even if you don't want to chat.",
            "notes": "Personalize the top_issue if you know the contact manages a specific program.",
        },
        "email_2": {
            "subjects": [
                f"Re: {ctx['uni_name']} audit — one number I wanted to flag",
                f"The {ctx['uni_name']} finding that surprised me most",
                "(reply in same thread)",
            ],
            "body": e2_body,
            "ps": "P.S. If now isn't the right time, happy to follow up in a month or two. Just let me know.",
            "notes": "Send as reply to Email 1 thread. Keep it under 150 words.",
        },
        "email_3": {
            "subjects": [
                f"A free fix for {ctx['uni_name']}'s admission page (takes 10 minutes)",
                f"One quick win for {ctx['uni_name']} — no consulting required",
                f"Thought you'd find this useful, {contact_name}",
            ],
            "body": e3_body,
            "ps": "P.S. If someone else on your team handles the website, feel free to forward this along.",
            "notes": "Give a genuinely useful, specific tip. Don't tease — give the full fix.",
        },
        "email_4": {
            "subjects": [
                f"Closing the loop on the {ctx['uni_name']} audit",
                f"Last note on this — wanted to make sure it reached you",
                f"{ctx['uni_name']} — a competitor insight I wanted to share",
            ],
            "body": e4_body,
            "ps": "",
            "notes": "Do not add new audit findings. The competitor angle is the only new hook at this stage.",
        },
        "email_5": {
            "subjects": [
                "Should I stop sending these?",
                f"Closing my file on {ctx['uni_name']}",
                "It's okay to say no",
            ],
            "body": e5_body,
            "ps": "",
            "notes": "Shortest email in the sequence. No pitch, no data. Just ask for a one-word reply.",
        },
        "linkedin_dm": {
            "body": linkedin_body,
            "notes": "Best for Admission Directors or VP Enrollment. Send DM 2–3 days after connecting.",
        },
    }


# ---------------------------------------------------------------------------
# Output formatting
# ---------------------------------------------------------------------------


def format_email_file(
    email_num: int,
    email_data: dict[str, Any],
    contact_email: str,
    day_offset: int,
) -> str:
    """Format an email dict into a plain-text file with metadata header."""
    subjects = email_data.get("subjects", ["(no subject)"])
    body = email_data.get("body", "")
    ps = email_data.get("ps", "")
    notes = email_data.get("notes", "")

    lines = [
        f"# Email {email_num} — Send on Day {day_offset}",
        f"# To: {contact_email}",
        "#",
        "# SUBJECT LINE OPTIONS (pick one, A/B test if sending in bulk):",
    ]
    for i, subject in enumerate(subjects, start=1):
        lines.append(f"# Option {chr(64+i)}: {subject}")
    lines += [
        "#",
        f"# NOTES: {notes}",
        "#",
        "=" * 60,
        "",
        body.strip(),
    ]
    if ps:
        lines += ["", ps.strip()]
    lines += [
        "",
        "=" * 60,
    ]
    return "\n".join(lines)


def format_linkedin_file(linkedin_data: dict[str, Any]) -> str:
    """Format the LinkedIn DM into a plain-text file."""
    body = linkedin_data.get("body", "")
    notes = linkedin_data.get("notes", "")
    lines = [
        "# LinkedIn DM",
        "#",
        f"# NOTES: {notes}",
        "#",
        "=" * 60,
        "",
        body.strip(),
        "",
        "=" * 60,
    ]
    return "\n".join(lines)


def slug_from_name(name: str) -> str:
    slug = name.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = re.sub(r"-+", "-", slug)
    return slug.strip("-")


# ---------------------------------------------------------------------------
# SMTP sending
# ---------------------------------------------------------------------------


def send_email_smtp(
    to_email: str,
    subject: str,
    body: str,
    from_name: str = FROM_NAME,
    from_email: str = FROM_EMAIL,
) -> None:
    """Send a plain-text email via SMTP."""
    if not SMTP_USER or not SMTP_PASS:
        raise EnvironmentError("SMTP_USER and SMTP_PASS must be set in your .env to send emails.")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{from_name} <{from_email}>" if from_name else from_email
    msg["To"] = to_email

    msg.attach(MIMEText(body, "plain", "utf-8"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.ehlo()
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(from_email, to_email, msg.as_string())
    print(f"  Sent to {to_email} — subject: {subject}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

EMAIL_DAY_OFFSETS = {1: 1, 2: 3, 3: 7, 4: 14, 5: 21}
EMAIL_FILE_NAMES = {
    1: "email_1_cold_intro.txt",
    2: "email_2_metric_hook.txt",
    3: "email_3_value_tip.txt",
    4: "email_4_last_attempt.txt",
    5: "email_5_breakup.txt",
}


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate a personalized UniAudit email outreach sequence.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    source_group = parser.add_mutually_exclusive_group()
    source_group.add_argument("--university-id", help="UniAudit university ID (MongoDB ObjectId)")
    source_group.add_argument("--from-json", metavar="FILE", help="Path to a JSON audit export file")

    parser.add_argument("--contact-name", required=True, help="First name of the recipient")
    parser.add_argument("--contact-email", default="", help="Email address of the recipient")
    parser.add_argument("--api-url", default=API_URL, help=f"UniAudit API base URL (default: {API_URL})")
    parser.add_argument("--your-name", default=FROM_NAME or "Your Name", help="Your name (sender)")
    parser.add_argument("--output-dir", default=str(OUTREACH_DIR / "output"), help="Output directory")
    parser.add_argument("--dry-run", action="store_true", help="Print output to stdout instead of saving")
    parser.add_argument("--send", action="store_true", help="Send Email 1 immediately via SMTP")
    parser.add_argument("--no-ai", action="store_true", help="Skip OpenAI; use built-in fallback templates")

    args = parser.parse_args()

    if not args.university_id and not args.from_json:
        parser.error("Provide either --university-id or --from-json")

    # --- Fetch audit data ---
    print("Fetching audit data...")
    if args.from_json:
        raw_data = load_from_json(args.from_json)
    else:
        raw_data = fetch_university_data(args.university_id, args.api_url)

    ctx = extract_audit_context(raw_data)
    print(f"  University: {ctx['uni_name']}")
    print(f"  Score: {ctx['overall_score']}/100 | Critical issues: {ctx['critical_issues_count']} | Pages: {ctx['pages_analyzed']}")

    if ctx["overall_score"] == 0 and ctx["pages_analyzed"] == 0:
        print("WARNING: Audit appears incomplete (score=0, pages=0). Check that analysis has finished.")

    # --- Generate email copy ---
    if args.no_ai:
        print("Generating emails with fallback templates (no AI)...")
        emails = render_template_fallback(ctx, args.contact_name, args.your_name)
    else:
        print("Generating personalized copy with Azure OpenAI...")
        try:
            emails = generate_with_openai(ctx, args.contact_name, args.your_name)
        except EnvironmentError as e:
            print(f"WARNING: {e}")
            print("Falling back to built-in templates. Use --no-ai to suppress this warning.")
            emails = render_template_fallback(ctx, args.contact_name, args.your_name)
        except Exception as e:
            print(f"ERROR: OpenAI generation failed: {e}")
            print("Falling back to built-in templates.")
            emails = render_template_fallback(ctx, args.contact_name, args.your_name)

    # --- Output ---
    output_slug = ctx["uni_slug"] or slug_from_name(ctx["uni_name"])
    output_path = Path(args.output_dir) / output_slug

    if not args.dry_run:
        output_path.mkdir(parents=True, exist_ok=True)
        print(f"\nSaving to {output_path}/")

    for num in range(1, 6):
        key = f"email_{num}"
        email_data = emails.get(key, {})
        day = EMAIL_DAY_OFFSETS[num]
        content = format_email_file(num, email_data, args.contact_email, day)
        filename = EMAIL_FILE_NAMES[num]

        if args.dry_run:
            print(f"\n{'='*60}")
            print(f"  {filename}")
            print(f"{'='*60}")
            print(content)
        else:
            out_file = output_path / filename
            out_file.write_text(content, encoding="utf-8")
            print(f"  Saved {filename}")

    # LinkedIn DM
    linkedin_data = emails.get("linkedin_dm", {})
    linkedin_content = format_linkedin_file(linkedin_data)
    linkedin_filename = "linkedin_dm.txt"

    if args.dry_run:
        print(f"\n{'='*60}")
        print(f"  {linkedin_filename}")
        print(f"{'='*60}")
        print(linkedin_content)
    else:
        (output_path / linkedin_filename).write_text(linkedin_content, encoding="utf-8")
        print(f"  Saved {linkedin_filename}")

    # --- Optionally send Email 1 ---
    if args.send:
        if not args.contact_email:
            print("\nERROR: --send requires --contact-email.")
            sys.exit(1)
        email_1_data = emails.get("email_1", {})
        subjects = email_1_data.get("subjects", ["UniAudit Report"])
        subject = subjects[0]  # Use Option A by default
        body = email_1_data.get("body", "")
        ps = email_1_data.get("ps", "")
        full_body = body.strip()
        if ps:
            full_body += f"\n\n{ps.strip()}"
        print(f"\nSending Email 1 to {args.contact_email}...")
        try:
            send_email_smtp(args.contact_email, subject, full_body)
        except Exception as e:
            print(f"ERROR: Failed to send email: {e}")
            sys.exit(1)

    if not args.dry_run:
        print(f"\nDone. All files saved to: {output_path}")
        print(f"Review and edit before sending. Start with {EMAIL_FILE_NAMES[1]}.")


if __name__ == "__main__":
    main()
