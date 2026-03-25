#!/usr/bin/env python3
"""
find_targets.py — UniAudit Target University Finder

Outputs a prioritized CSV of universities to audit and contact.
Includes a curated starter list of 60+ mid-tier and international-focused
universities in English-speaking countries, plus utilities to discover
admission contact emails from a university's website.

Usage:
    # Export the built-in starter list to CSV
    python find_targets.py --output targets.csv

    # Discover contacts for a specific domain
    python find_targets.py --domain northumbria.ac.uk --find-contacts

    # Find contacts for all universities in an existing CSV
    python find_targets.py --input targets.csv --find-contacts --output targets_with_contacts.csv

    # Filter by country or tier
    python find_targets.py --country UK --tier mid --output uk_mid_tier.csv
"""

from __future__ import annotations

import argparse
import csv
import re
import sys
import time
from dataclasses import dataclass, field, fields
from typing import Optional
from urllib.parse import urljoin, urlparse

try:
    import httpx
    from bs4 import BeautifulSoup
    HAS_DEPS = True
except ImportError:
    HAS_DEPS = False


# ---------------------------------------------------------------------------
# University target data
# ---------------------------------------------------------------------------


@dataclass
class UniversityTarget:
    name: str
    domain: str
    country: str
    tier: str                      # "mid", "emerging", "regional", "international_focus"
    focus: str                     # "international", "research", "teaching", "regional"
    estimated_contact: str = ""    # discovered or guessed email
    contact_confidence: str = ""   # "verified", "guessed", "unknown"
    notes: str = ""
    priority_score: int = 0        # computed from tier + focus


# ---------------------------------------------------------------------------
# Starter list — 60+ curated targets
# ---------------------------------------------------------------------------
# Criteria:
#   - Mid-tier (more likely to respond, less bureaucracy than top-20)
#   - International student-focused (motivated to improve online experience)
#   - English-speaking countries (US, UK, Canada, Australia, NZ, Ireland)
#   - Mix of sizes and regions
# ---------------------------------------------------------------------------

STARTER_TARGETS: list[UniversityTarget] = [

    # --- United Kingdom ---
    UniversityTarget("Northumbria University", "northumbria.ac.uk", "UK", "mid", "international_focus",
                     notes="Large modern university, heavy international recruitment"),
    UniversityTarget("Coventry University", "coventry.ac.uk", "UK", "mid", "international_focus",
                     notes="One of UK's largest international student intakes"),
    UniversityTarget("De Montfort University", "dmu.ac.uk", "UK", "mid", "international_focus",
                     notes="Strong international focus, active recruitment in South Asia"),
    UniversityTarget("Anglia Ruskin University", "aru.ac.uk", "UK", "mid", "teaching",
                     notes="Multiple campuses, growing international cohort"),
    UniversityTarget("University of Hertfordshire", "herts.ac.uk", "UK", "mid", "international_focus",
                     notes="Known for aviation, strong industry links"),
    UniversityTarget("University of Huddersfield", "hud.ac.uk", "UK", "mid", "teaching",
                     notes="Teaching-focused, good employability record"),
    UniversityTarget("Teesside University", "tees.ac.uk", "UK", "regional", "teaching",
                     notes="Northeast England, growing research profile"),
    UniversityTarget("University of the West of England", "uwe.ac.uk", "UK", "mid", "teaching",
                     notes="Bristol-based, large student body"),
    UniversityTarget("University of Derby", "derby.ac.uk", "UK", "regional", "teaching",
                     notes="Broad subject range, strong online presence push"),
    UniversityTarget("University of Salford", "salford.ac.uk", "UK", "mid", "international_focus",
                     notes="Manchester area, media and arts focus"),
    UniversityTarget("University of the West of Scotland", "uws.ac.uk", "UK", "regional", "international_focus",
                     notes="Multiple Scottish campuses"),
    UniversityTarget("Bournemouth University", "bournemouth.ac.uk", "UK", "mid", "teaching",
                     notes="Strong media and tourism programs"),
    UniversityTarget("Middlesex University", "mdx.ac.uk", "UK", "mid", "international_focus",
                     notes="Very high international student proportion, London + Dubai + Mauritius campuses"),
    UniversityTarget("University of Bolton", "bolton.ac.uk", "UK", "regional", "teaching",
                     notes="Smaller institution, strong vocational focus"),
    UniversityTarget("University of Bedfordshire", "beds.ac.uk", "UK", "mid", "international_focus",
                     notes="Large international intake relative to size"),

    # --- United States ---
    UniversityTarget("Drexel University", "drexel.edu", "US", "mid", "international_focus",
                     notes="Philadelphia, strong co-op programs, active international recruitment"),
    UniversityTarget("Clark University", "clarku.edu", "US", "mid", "international_focus",
                     notes="OPT STEM programs attract international grad students"),
    UniversityTarget("University of New Haven", "newhaven.edu", "US", "mid", "teaching",
                     notes="Connecticut, growing forensic science program"),
    UniversityTarget("Pace University", "pace.edu", "US", "mid", "international_focus",
                     notes="NYC and Pleasantville, strong business school"),
    UniversityTarget("Long Island University", "liu.edu", "US", "mid", "teaching",
                     notes="Multiple NY campuses, broad program range"),
    UniversityTarget("Suffolk University", "suffolk.edu", "US", "mid", "international_focus",
                     notes="Boston, significant international enrollment"),
    UniversityTarget("Hofstra University", "hofstra.edu", "US", "mid", "teaching",
                     notes="Long Island NY, law school and medical school"),
    UniversityTarget("Saint Louis University", "slu.edu", "US", "mid", "research",
                     notes="Jesuit university, growing international programs"),
    UniversityTarget("Loyola University Chicago", "luc.edu", "US", "mid", "research",
                     notes="Jesuit, strong health sciences"),
    UniversityTarget("University of the Pacific", "pacific.edu", "US", "mid", "teaching",
                     notes="California, pharmacy and dentistry programs"),
    UniversityTarget("University of Hartford", "hartford.edu", "US", "mid", "teaching",
                     notes="Connecticut, engineering and arts"),
    UniversityTarget("Quinnipiac University", "quinnipiac.edu", "US", "mid", "teaching",
                     notes="Connecticut, strong journalism and health programs"),
    UniversityTarget("Seton Hall University", "shu.edu", "US", "mid", "research",
                     notes="New Jersey, law and diplomacy focus"),
    UniversityTarget("University of Dayton", "udayton.edu", "US", "mid", "research",
                     notes="Ohio, Catholic research university"),
    UniversityTarget("Marquette University", "marquette.edu", "US", "mid", "research",
                     notes="Milwaukee, Jesuit, engineering and business"),

    # --- Canada ---
    UniversityTarget("Ryerson University (Toronto Metropolitan)", "torontomu.ca", "Canada", "mid", "international_focus",
                     notes="Newly rebranded, heavy international recruitment, urban campus"),
    UniversityTarget("Brock University", "brocku.ca", "Canada", "mid", "teaching",
                     notes="Niagara region, growing international cohort"),
    UniversityTarget("University of Windsor", "uwindsor.ca", "Canada", "mid", "international_focus",
                     notes="Border city, large international student population"),
    UniversityTarget("Wilfrid Laurier University", "wlu.ca", "Canada", "mid", "teaching",
                     notes="Business and music focus, dual campus"),
    UniversityTarget("University of Regina", "uregina.ca", "Canada", "regional", "international_focus",
                     notes="Saskatchewan, active international recruitment"),
    UniversityTarget("Lakehead University", "lakeheadu.ca", "Canada", "regional", "international_focus",
                     notes="Thunder Bay and Orillia, growing international intake"),
    UniversityTarget("Trent University", "trentu.ca", "Canada", "regional", "teaching",
                     notes="Peterborough, strong indigenous studies programs"),
    UniversityTarget("Royal Roads University", "royalroads.ca", "Canada", "mid", "international_focus",
                     notes="Victoria BC, professional and applied programs"),
    UniversityTarget("Capilano University", "capilanou.ca", "Canada", "regional", "international_focus",
                     notes="North Vancouver, growing international programs"),

    # --- Australia ---
    UniversityTarget("University of the Sunshine Coast", "usc.edu.au", "Australia", "regional", "international_focus",
                     notes="Queensland, smaller institution growing fast"),
    UniversityTarget("Federation University Australia", "federation.edu.au", "Australia", "regional", "teaching",
                     notes="Victoria, TAFE pathways and degree programs"),
    UniversityTarget("Charles Darwin University", "cdu.edu.au", "Australia", "regional", "international_focus",
                     notes="Darwin NT, online and on-campus, unique market"),
    UniversityTarget("University of Southern Queensland", "usq.edu.au", "Australia", "regional", "international_focus",
                     notes="Online-first approach, broad international reach"),
    UniversityTarget("CQUniversity Australia", "cqu.edu.au", "Australia", "regional", "international_focus",
                     notes="Multi-campus, vocational and degree pathways"),
    UniversityTarget("Torrens University Australia", "torrens.edu.au", "Australia", "emerging", "international_focus",
                     notes="Private university, design and business focus, Melbourne/Sydney"),
    UniversityTarget("University of the Sunshine Coast", "usc.edu.au", "Australia", "regional", "teaching",
                     notes="Sunshine Coast QLD, growing research profile"),
    UniversityTarget("Murdoch University", "murdoch.edu.au", "Australia", "mid", "international_focus",
                     notes="Perth, strong international recruitment from Asia"),
    UniversityTarget("Edith Cowan University", "ecu.edu.au", "Australia", "mid", "international_focus",
                     notes="Perth, cybersecurity and creative arts focus"),

    # --- New Zealand ---
    UniversityTarget("Auckland University of Technology", "aut.ac.nz", "NZ", "mid", "international_focus",
                     notes="Second largest NZ university, heavy international intake"),
    UniversityTarget("Massey University", "massey.ac.nz", "NZ", "mid", "international_focus",
                     notes="Multi-campus, distance learning, large international cohort"),
    UniversityTarget("Victoria University of Wellington", "wgtn.ac.nz", "NZ", "mid", "research",
                     notes="Capital city, law and public policy strength"),
    UniversityTarget("Lincoln University", "lincoln.ac.nz", "NZ", "regional", "international_focus",
                     notes="Canterbury, agriculture and environment focus"),
    UniversityTarget("Eastern Institute of Technology", "eit.ac.nz", "NZ", "regional", "teaching",
                     notes="Hawke's Bay, vocational and degree programs"),

    # --- Ireland ---
    UniversityTarget("Dublin City University", "dcu.ie", "Ireland", "mid", "international_focus",
                     notes="Dublin, strong STEM and business, gateway to EU for international students"),
    UniversityTarget("University of Limerick", "ul.ie", "Ireland", "mid", "international_focus",
                     notes="Co-op programs, growing international profile"),
    UniversityTarget("Maynooth University", "mu.ie", "Ireland", "mid", "research",
                     notes="Near Dublin, arts and sciences focus"),
    UniversityTarget("Technological University Dublin", "tudublin.ie", "Ireland", "mid", "teaching",
                     notes="Largest TU in Ireland, broad program range"),
    UniversityTarget("Munster Technological University", "mtu.ie", "Ireland", "regional", "teaching",
                     notes="Cork and Kerry campuses, engineering and business"),
    UniversityTarget("Atlantic Technological University", "atu.ie", "Ireland", "regional", "teaching",
                     notes="West of Ireland campuses, emerging institution"),
    UniversityTarget("Institute of Technology Carlow", "itcarlow.ie", "Ireland", "regional", "teaching",
                     notes="Southeast Ireland, computing and engineering focus"),

    # --- Bonus: international-facing US online/hybrid institutions ---
    UniversityTarget("Northeastern University", "northeastern.edu", "US", "mid", "international_focus",
                     notes="Boston + global campuses, very active international grad recruitment"),
    UniversityTarget("Merrimack College", "merrimack.edu", "US", "regional", "teaching",
                     notes="Massachusetts, growing international programs"),
    UniversityTarget("American University", "american.edu", "US", "mid", "international_focus",
                     notes="DC, international relations and policy, strong international draw"),
]


# ---------------------------------------------------------------------------
# Priority scoring
# ---------------------------------------------------------------------------

TIER_SCORES = {"emerging": 95, "mid": 80, "regional": 70, "top": 30}
FOCUS_SCORES = {"international_focus": 20, "teaching": 10, "research": 5, "regional": 8}


def compute_priority(target: UniversityTarget) -> int:
    """Score a target 0–100. Higher = higher priority for outreach."""
    score = TIER_SCORES.get(target.tier, 50) + FOCUS_SCORES.get(target.focus, 0)
    return min(score, 100)


# ---------------------------------------------------------------------------
# Contact discovery
# ---------------------------------------------------------------------------

# Common paths that lead to admission contact pages
CONTACT_PATHS = [
    "/admissions/contact",
    "/admissions/contact-us",
    "/international/contact",
    "/international/admissions/contact",
    "/study/international/contact",
    "/future-students/contact",
    "/study-with-us/contact",
    "/admissions",
    "/international",
    "/contact",
    "/contact-us",
    "/about/contact",
]

EMAIL_PATTERN = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")

# Keywords that suggest an email belongs to admissions/international office
ADMISSION_KEYWORDS = [
    "admiss", "enrol", "enroll", "international", "future", "apply",
    "student", "recruit", "register", "intake",
]


def is_admission_email(email: str) -> bool:
    """Return True if the email address looks like an admissions contact."""
    local_part = email.split("@")[0].lower()
    return any(kw in local_part for kw in ADMISSION_KEYWORDS)


def guess_contact_email(domain: str) -> tuple[str, str]:
    """
    Guess the most likely admission contact email for a domain.
    Returns (email, confidence) where confidence is "guessed" or "unknown".
    """
    guesses = [
        f"admissions@{domain}",
        f"international@{domain}",
        f"futurestudents@{domain}",
        f"enquiries@{domain}",
        f"study@{domain}",
    ]
    return guesses[0], "guessed"


def scrape_contact_emails(domain: str, timeout: int = 10) -> list[tuple[str, str]]:
    """
    Scrape admission contact emails from a university's website.
    Returns list of (email, source_url) tuples.
    """
    if not HAS_DEPS:
        raise ImportError("httpx and beautifulsoup4 are required. Run: pip install httpx beautifulsoup4")

    found: list[tuple[str, str]] = []
    base = f"https://www.{domain}" if not domain.startswith("http") else domain

    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; UniAudit/1.0; +https://uni-audit.com)",
        "Accept": "text/html",
    }

    with httpx.Client(timeout=timeout, follow_redirects=True, headers=headers) as client:
        for path in CONTACT_PATHS:
            url = urljoin(base, path)
            try:
                resp = client.get(url)
                if resp.status_code != 200:
                    continue
                soup = BeautifulSoup(resp.text, "html.parser")
                text = soup.get_text(separator=" ")
                emails = EMAIL_PATTERN.findall(text)
                for email in emails:
                    email = email.lower().strip(".,;")
                    # Filter out image file patterns and noise
                    if "." in email.split("@")[-1] and len(email) < 80:
                        found.append((email, url))
                if found:
                    break  # Stop at the first path that yields emails
                time.sleep(0.5)
            except Exception:
                continue

    return found


def find_best_contact(domain: str) -> tuple[str, str]:
    """
    Find the best admission contact email for a domain.
    Returns (email, confidence).
    """
    try:
        emails_with_sources = scrape_contact_emails(domain)
        if not emails_with_sources:
            return guess_contact_email(domain)

        # Prefer emails that look like admissions contacts
        admission_emails = [e for e, _ in emails_with_sources if is_admission_email(e)]
        if admission_emails:
            return admission_emails[0], "scraped"

        # Fall back to any email found on a contact page
        return emails_with_sources[0][0], "scraped_generic"
    except ImportError:
        return guess_contact_email(domain)
    except Exception:
        return guess_contact_email(domain)


# ---------------------------------------------------------------------------
# CSV output
# ---------------------------------------------------------------------------


def targets_to_csv(targets: list[UniversityTarget], output_path: str) -> None:
    """Write targets to a CSV file."""
    fieldnames = [
        "name", "domain", "country", "tier", "focus",
        "estimated_contact", "contact_confidence", "priority_score", "notes",
    ]
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for t in targets:
            writer.writerow({
                "name": t.name,
                "domain": t.domain,
                "country": t.country,
                "tier": t.tier,
                "focus": t.focus,
                "estimated_contact": t.estimated_contact,
                "contact_confidence": t.contact_confidence,
                "priority_score": t.priority_score,
                "notes": t.notes,
            })
    print(f"Saved {len(targets)} universities to {output_path}")


def targets_from_csv(input_path: str) -> list[UniversityTarget]:
    """Load targets from a CSV file."""
    targets = []
    with open(input_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            t = UniversityTarget(
                name=row.get("name", ""),
                domain=row.get("domain", ""),
                country=row.get("country", ""),
                tier=row.get("tier", "mid"),
                focus=row.get("focus", "teaching"),
                estimated_contact=row.get("estimated_contact", ""),
                contact_confidence=row.get("contact_confidence", "unknown"),
                notes=row.get("notes", ""),
            )
            t.priority_score = int(row.get("priority_score", compute_priority(t)))
            targets.append(t)
    return targets


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Find and score university outreach targets.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("--output", "-o", default="targets.csv", help="Output CSV path (default: targets.csv)")
    parser.add_argument("--input", "-i", help="Input CSV to enrich (instead of the built-in starter list)")
    parser.add_argument("--find-contacts", action="store_true", help="Scrape / guess contact emails for each target")
    parser.add_argument("--domain", help="Find contacts for a single specific domain")
    parser.add_argument("--country", help="Filter by country (e.g. UK, US, Canada)")
    parser.add_argument("--tier", help="Filter by tier (mid, emerging, regional, top)")
    parser.add_argument("--min-priority", type=int, default=0, help="Minimum priority score (0–100)")
    parser.add_argument("--limit", type=int, default=0, help="Maximum number of targets to output (0 = all)")
    parser.add_argument("--sort", choices=["priority", "country", "name"], default="priority",
                        help="Sort output by this field")

    args = parser.parse_args()

    # Single domain lookup
    if args.domain:
        print(f"Finding contacts for {args.domain}...")
        email, confidence = find_best_contact(args.domain)
        print(f"  Best contact: {email} (confidence: {confidence})")
        if args.find_contacts:
            try:
                raw = scrape_contact_emails(args.domain)
                if raw:
                    print("  All emails found:")
                    for e, source in raw[:10]:
                        print(f"    {e}  (from {source})")
            except ImportError:
                print("  Install httpx and beautifulsoup4 to scrape contacts.")
        return

    # Load targets
    if args.input:
        print(f"Loading targets from {args.input}...")
        targets = targets_from_csv(args.input)
    else:
        print(f"Using built-in starter list ({len(STARTER_TARGETS)} universities)...")
        targets = list(STARTER_TARGETS)

    # Compute priority scores
    for t in targets:
        if t.priority_score == 0:
            t.priority_score = compute_priority(t)

    # Apply filters
    if args.country:
        targets = [t for t in targets if t.country.lower() == args.country.lower()]
        print(f"  Filtered to {len(targets)} targets in {args.country}")

    if args.tier:
        targets = [t for t in targets if t.tier.lower() == args.tier.lower()]
        print(f"  Filtered to {len(targets)} targets with tier={args.tier}")

    if args.min_priority:
        targets = [t for t in targets if t.priority_score >= args.min_priority]
        print(f"  Filtered to {len(targets)} targets with priority >= {args.min_priority}")

    # Remove duplicates by domain
    seen_domains: set[str] = set()
    deduped = []
    for t in targets:
        if t.domain not in seen_domains:
            seen_domains.add(t.domain)
            deduped.append(t)
    targets = deduped

    # Sort
    if args.sort == "priority":
        targets.sort(key=lambda t: t.priority_score, reverse=True)
    elif args.sort == "country":
        targets.sort(key=lambda t: (t.country, t.name))
    elif args.sort == "name":
        targets.sort(key=lambda t: t.name)

    # Apply limit
    if args.limit:
        targets = targets[:args.limit]

    # Find contacts
    if args.find_contacts:
        if not HAS_DEPS:
            print("WARNING: httpx and beautifulsoup4 not installed. Using email guesses instead.")
            print("Install with: pip install httpx beautifulsoup4")

        print(f"\nFinding contacts for {len(targets)} universities...")
        for i, t in enumerate(targets, 1):
            if t.estimated_contact:
                print(f"  [{i}/{len(targets)}] {t.name} — already has contact, skipping")
                continue
            print(f"  [{i}/{len(targets)}] {t.name} ({t.domain})...", end=" ", flush=True)
            email, confidence = find_best_contact(t.domain)
            t.estimated_contact = email
            t.contact_confidence = confidence
            print(f"{email} ({confidence})")
            time.sleep(1)  # Be polite to university servers
    else:
        # At minimum, guess contacts for all targets
        for t in targets:
            if not t.estimated_contact:
                t.estimated_contact, t.contact_confidence = guess_contact_email(t.domain)

    # Output
    print(f"\nTop 10 by priority:")
    print(f"{'#':<4} {'University':<45} {'Country':<10} {'Score':<7} {'Contact'}")
    print("-" * 100)
    for i, t in enumerate(targets[:10], 1):
        print(f"{i:<4} {t.name:<45} {t.country:<10} {t.priority_score:<7} {t.estimated_contact}")

    targets_to_csv(targets, args.output)
    print(f"\nNext step: audit the top targets with UniAudit, then run generate_email.py for each.")


if __name__ == "__main__":
    main()
