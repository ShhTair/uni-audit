"""
Content extraction from raw HTML using BeautifulSoup.
Identifies page sections, heading structure, meta information,
dynamic content markers, link locations, and page metrics.
"""

import re
from dataclasses import dataclass, field
from typing import Optional
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup, Tag


@dataclass
class ExtractedLink:
    url: str
    text: str
    location: str  # header / footer / sidebar / main_content / breadcrumb / inline / button / carousel / modal / dropdown
    is_internal: bool


@dataclass
class HeadingEntry:
    level: int
    text: str


@dataclass
class ExtractedContent:
    title: str = ""
    meta_description: Optional[str] = None
    language: str = "en"
    last_modified: Optional[str] = None
    word_count: int = 0
    image_count: int = 0
    link_count: int = 0
    external_link_count: int = 0
    has_structured_data: bool = False
    has_dynamic_content: bool = False
    dynamic_elements: list[str] = field(default_factory=list)
    heading_structure: list[HeadingEntry] = field(default_factory=list)
    links: list[ExtractedLink] = field(default_factory=list)
    main_text: str = ""
    readability_score: float = 50.0
    image_text_detected: bool = False


# Selectors to identify page regions
_HEADER_SELECTORS = ["header", "nav", '[role="banner"]', '[role="navigation"]', ".navbar", ".nav-bar", "#header", ".header", ".top-nav", ".main-nav"]
_FOOTER_SELECTORS = ["footer", '[role="contentinfo"]', "#footer", ".footer", ".site-footer"]
_SIDEBAR_SELECTORS = ["aside", '[role="complementary"]', ".sidebar", "#sidebar", ".side-nav", ".side-menu"]
_BREADCRUMB_SELECTORS = [".breadcrumb", ".breadcrumbs", '[aria-label="breadcrumb"]', ".crumbs", "#breadcrumbs"]
_CAROUSEL_SELECTORS = [".carousel", ".slider", ".slick", ".swiper", '[data-ride="carousel"]']
_MODAL_SELECTORS = [".modal", '[role="dialog"]', ".popup", ".overlay-content"]
_DROPDOWN_SELECTORS = [".dropdown-menu", ".submenu", ".sub-menu", '[aria-expanded]']
_BUTTON_SELECTORS = ["button", ".btn", '[role="button"]', 'a.button', 'a.btn']
_DYNAMIC_MARKERS = ["[data-src]", "[data-lazy]", "[data-load]", ".lazy-load", ".infinite-scroll", "[data-ajax]", "[v-if]", "[ng-if]", "[x-show]", "[data-react-component]"]


def _element_in_region(element: Tag, region_selectors: list[str], soup: BeautifulSoup) -> bool:
    """Check if an element is inside one of the given region selectors."""
    for selector in region_selectors:
        try:
            regions = soup.select(selector)
        except Exception:
            continue
        for region in regions:
            if element in region.descendants:
                return True
    return False


def _detect_link_location(link_tag: Tag, soup: BeautifulSoup) -> str:
    """Determine where on the page a link lives."""
    if _element_in_region(link_tag, _BREADCRUMB_SELECTORS, soup):
        return "breadcrumb"
    if _element_in_region(link_tag, _HEADER_SELECTORS, soup):
        return "header"
    if _element_in_region(link_tag, _FOOTER_SELECTORS, soup):
        return "footer"
    if _element_in_region(link_tag, _SIDEBAR_SELECTORS, soup):
        return "sidebar"
    if _element_in_region(link_tag, _CAROUSEL_SELECTORS, soup):
        return "carousel"
    if _element_in_region(link_tag, _MODAL_SELECTORS, soup):
        return "modal"
    if _element_in_region(link_tag, _DROPDOWN_SELECTORS, soup):
        return "dropdown"
    # Check if the link itself is styled as a button
    classes = " ".join(link_tag.get("class", []))
    if link_tag.name == "button" or "btn" in classes or link_tag.get("role") == "button":
        return "button"
    return "main_content"


def _is_internal(href: str, domains: list[str], base_url: str) -> bool:
    """Check if a URL belongs to one of the university's domains."""
    if not href or href.startswith(("#", "mailto:", "tel:", "javascript:")):
        return False
    absolute = urljoin(base_url, href)
    parsed = urlparse(absolute)
    host = parsed.hostname or ""
    for domain in domains:
        if host == domain or host.endswith("." + domain):
            return True
    return False


def _flesch_reading_ease(text: str) -> float:
    """Approximate Flesch reading ease score."""
    sentences = re.split(r"[.!?]+", text)
    sentences = [s.strip() for s in sentences if s.strip()]
    words = text.split()
    if not sentences or not words:
        return 50.0
    syllable_count = 0
    for word in words:
        word_clean = re.sub(r"[^a-zA-Z]", "", word).lower()
        if not word_clean:
            continue
        count = 0
        vowels = "aeiouy"
        prev_vowel = False
        for ch in word_clean:
            is_vowel = ch in vowels
            if is_vowel and not prev_vowel:
                count += 1
            prev_vowel = is_vowel
        if word_clean.endswith("e") and count > 1:
            count -= 1
        syllable_count += max(count, 1)
    asl = len(words) / max(len(sentences), 1)
    asw = syllable_count / max(len(words), 1)
    score = 206.835 - 1.015 * asl - 84.6 * asw
    return max(0.0, min(100.0, score))


class ContentExtractor:
    """Extract structured content from raw HTML."""

    def __init__(self, html: str, page_url: str, domains: list[str]):
        self.html = html
        self.page_url = page_url
        self.domains = domains
        self.soup = BeautifulSoup(html, "lxml")

    def extract(self) -> ExtractedContent:
        result = ExtractedContent()

        # Title
        title_tag = self.soup.find("title")
        if title_tag:
            result.title = title_tag.get_text(strip=True)

        # Language
        html_tag = self.soup.find("html")
        if html_tag and html_tag.get("lang"):
            result.language = html_tag["lang"][:5]

        # Meta description
        meta_desc = self.soup.find("meta", attrs={"name": "description"})
        if meta_desc and meta_desc.get("content"):
            result.meta_description = meta_desc["content"]

        # Last modified
        meta_mod = self.soup.find("meta", attrs={"http-equiv": re.compile(r"last-modified", re.I)})
        if meta_mod and meta_mod.get("content"):
            result.last_modified = meta_mod["content"]
        else:
            meta_mod2 = self.soup.find("meta", attrs={"name": re.compile(r"(date|modified|updated)", re.I)})
            if meta_mod2 and meta_mod2.get("content"):
                result.last_modified = meta_mod2["content"]

        # Structured data
        result.has_structured_data = bool(
            self.soup.find("script", attrs={"type": "application/ld+json"})
            or self.soup.find(attrs={"itemscope": True})
        )

        # Heading structure
        for level in range(1, 7):
            for h in self.soup.find_all(f"h{level}"):
                text = h.get_text(strip=True)
                if text:
                    result.heading_structure.append(HeadingEntry(level=level, text=text[:200]))

        # Images
        images = self.soup.find_all("img")
        result.image_count = len(images)

        # Detect image-instead-of-text pattern
        main_area = self.soup.find("main") or self.soup.find("article") or self.soup.find(id="content") or self.soup.body
        if main_area:
            main_text_raw = main_area.get_text(separator=" ", strip=True)
            main_images_in_area = main_area.find_all("img") if main_area else []
            if len(main_images_in_area) > 3 and len(main_text_raw.split()) < 50:
                result.image_text_detected = True

        # Dynamic content markers
        for selector in _DYNAMIC_MARKERS:
            try:
                found = self.soup.select(selector)
                if found:
                    result.has_dynamic_content = True
                    result.dynamic_elements.append(f"{selector}: {len(found)} elements")
            except Exception:
                continue
        scripts = self.soup.find_all("script")
        for script in scripts:
            src = script.get("src", "") or ""
            text = script.string or ""
            if any(kw in src.lower() or kw in text.lower() for kw in ["react", "angular", "vue", "next", "gatsby", "nuxt"]):
                result.has_dynamic_content = True
                result.dynamic_elements.append("JavaScript framework detected")
                break

        # Extract main text (remove scripts, styles, nav, footer, header)
        body = self.soup.find("body")
        if body:
            body_copy = BeautifulSoup(str(body), "lxml")
            for tag in body_copy.find_all(["script", "style", "noscript"]):
                tag.decompose()
            result.main_text = body_copy.get_text(separator="\n", strip=True)
        else:
            result.main_text = self.soup.get_text(separator="\n", strip=True)

        words = result.main_text.split()
        result.word_count = len(words)
        result.readability_score = _flesch_reading_ease(result.main_text)

        # Links
        all_links = self.soup.find_all("a", href=True)
        result.link_count = len(all_links)
        for a_tag in all_links:
            href = a_tag["href"]
            if href.startswith(("#", "mailto:", "tel:", "javascript:")):
                continue
            absolute_url = urljoin(self.page_url, href)
            internal = _is_internal(href, self.domains, self.page_url)
            if not internal:
                result.external_link_count += 1
            location = _detect_link_location(a_tag, self.soup)
            link_text = a_tag.get_text(strip=True) or a_tag.get("title", "") or a_tag.get("aria-label", "") or ""
            result.links.append(
                ExtractedLink(
                    url=absolute_url,
                    text=link_text[:300],
                    location=location,
                    is_internal=internal,
                )
            )

        return result
