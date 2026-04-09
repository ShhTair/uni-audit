"""
HTML cleaner — strips boilerplate before converting to Markdown.

University pages are full of:
- Navigation menus (100+ links)
- Cookie consent banners
- Footer legal text
- Social media widgets
- Breadcrumbs (noise for content analysis)
- Script/style blocks
- Sidebar ads and CTAs

This module removes all that and returns clean body HTML
that converts to useful Markdown for AI analysis.
"""

import re
from typing import Optional
from bs4 import BeautifulSoup, Tag
import html2text

# ── Elements to remove entirely ──────────────────────────────────────────────

_REMOVE_TAGS = [
    "script", "style", "noscript", "iframe", "svg", "canvas",
    "template", "picture",  # picture = decorative image containers
]

_REMOVE_SELECTORS = [
    # Navigation
    "nav", "header", '[role="navigation"]', '[role="banner"]',
    ".navbar", ".nav-bar", ".navigation", ".main-nav", ".primary-nav",
    ".site-header", ".page-header", ".top-bar", ".top-nav",
    "#navbar", "#header", "#top-nav", "#main-nav",
    # Mega-menus / dropdowns
    ".mega-menu", ".dropdown-menu", ".submenu", ".sub-menu",
    # Footer
    "footer", '[role="contentinfo"]', ".footer", ".site-footer",
    "#footer", ".bottom-nav", ".footer-links",
    # Cookie / GDPR banners
    ".cookie-banner", ".cookie-consent", ".cookie-notice", "#cookie-notice",
    ".gdpr", "[class*='cookie']", "[id*='cookie']",
    "[class*='consent']", "[id*='consent']",
    # Overlays / modals / popups
    '[role="dialog"]', ".modal", ".popup", ".overlay",
    ".chat-widget", ".live-chat", ".intercom-frame",
    # Social / sharing
    ".social-share", ".share-buttons", ".addthis", ".sharethis",
    # Sidebar widgets (not main content)
    ".sidebar-widget", ".widget-area", ".sidebar-nav",
    # Search bars
    ".search-form", ".search-widget", '[role="search"]',
    # Skip links / a11y helpers (not content)
    ".skip-link", ".visually-hidden-focusable",
    # Print / utility bars
    ".print-button", ".utility-bar",
    # Decorative / background images
    ".hero-image", ".banner-image",
    # Pagination (not useful for content analysis)
    ".pagination", ".pager",
    # Breadcrumbs (noisy for content, already captured elsewhere)
    ".breadcrumb", ".breadcrumbs", '[aria-label="breadcrumb"]',
    # Related content / recommendations
    ".related-content", ".recommended", ".you-may-also-like",
    # Alerts that are not content
    ".alert-dismissible",
]

# ── html2text config for clean Markdown ──────────────────────────────────────

def _make_converter() -> html2text.HTML2Text:
    h = html2text.HTML2Text()
    h.ignore_links = False        # keep links — useful for tag detection
    h.ignore_images = True        # images add no text value
    h.ignore_emphasis = False
    h.body_width = 0              # no line wrapping
    h.unicode_snob = True
    h.skip_internal_links = False
    h.mark_code = True            # wrap code blocks
    h.wrap_links = False
    h.protect_links = False
    h.ul_item_mark = "-"
    return h

_CONVERTER = _make_converter()

# ── Normalisation helpers ─────────────────────────────────────────────────────

_BLANK_LINES_RE = re.compile(r'\n{3,}')
_LINK_ONLY_LINE_RE = re.compile(r'^\s*\[.*?\]\(.*?\)\s*$', re.MULTILINE)


def _normalise_markdown(md: str) -> str:
    """Remove excessive blank lines and link-only lines (nav residue)."""
    # Collapse 3+ blank lines → 2
    md = _BLANK_LINES_RE.sub('\n\n', md)
    # Remove lines that are purely a markdown link (navigation residue)
    # Only remove if there are many of them in a row (>3 consecutive)
    lines = md.splitlines()
    out, consecutive_links = [], 0
    for line in lines:
        if _LINK_ONLY_LINE_RE.match(line):
            consecutive_links += 1
            if consecutive_links <= 3:  # keep first few (in-page TOC etc.)
                out.append(line)
        else:
            consecutive_links = 0
            out.append(line)
    return '\n'.join(out).strip()


# ── Main API ──────────────────────────────────────────────────────────────────

def clean_html(html: str, base_url: str = "") -> str:
    """
    Remove boilerplate from HTML and return clean body HTML.
    Preserves main content, headings, paragraphs, tables, lists.
    """
    soup = BeautifulSoup(html, "lxml")

    # 1. Remove script/style/svg/noscript
    for tag in _REMOVE_TAGS:
        for el in soup.find_all(tag):
            el.decompose()

    # 2. Remove by CSS selector
    for sel in _REMOVE_SELECTORS:
        for el in soup.select(sel):
            el.decompose()

    # 3. Try to isolate main content area
    main = (
        soup.find("main")
        or soup.find(id="main-content")
        or soup.find(id="content")
        or soup.find(class_="main-content")
        or soup.find(class_="page-content")
        or soup.find(class_="content-area")
        or soup.find(role="main")  # type: ignore[call-arg]
        or soup.find(attrs={"role": "main"})
    )

    if main:
        return str(main)

    # 4. Fallback: return cleaned body
    body = soup.find("body")
    return str(body) if body else str(soup)


def html_to_clean_markdown(html: str, base_url: str = "") -> str:
    """
    Full pipeline: HTML → clean HTML → Markdown.
    This is the main function used by crawlers.
    """
    try:
        clean = clean_html(html, base_url)
        md = _CONVERTER.handle(clean)
        return _normalise_markdown(md)
    except Exception:
        # Last resort: convert raw HTML
        try:
            return _CONVERTER.handle(html).strip()
        except Exception:
            return ""


def estimate_content_quality(markdown: str) -> float:
    """
    Quick heuristic content quality score 0–1 based on Markdown.
    Higher = more substantive content.
    """
    if not markdown:
        return 0.0

    words = len(markdown.split())
    headings = markdown.count('\n#')
    lists = markdown.count('\n- ') + markdown.count('\n* ')
    tables = markdown.count('|---|')
    code_blocks = markdown.count('```')

    # Penalise very short content
    if words < 50:
        return 0.1

    score = min(1.0, (
        min(words / 500, 0.5) +         # up to 0.5 for word count
        min(headings * 0.05, 0.2) +     # up to 0.2 for headings
        min(lists * 0.01, 0.15) +       # up to 0.15 for lists
        min(tables * 0.05, 0.1) +       # up to 0.1 for tables
        min(code_blocks * 0.02, 0.05)   # up to 0.05 for code/pre
    ))
    return round(score, 3)
