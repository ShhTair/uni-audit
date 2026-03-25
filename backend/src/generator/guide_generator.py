"""
Admission Guide Generator.

Collects analyzed university page data from MongoDB, uses Azure OpenAI
to synthesize scattered info into coherent guide sections.
"""

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Any, Optional

import httpx
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from src.config import settings

logger = logging.getLogger("uni_audit.guide_generator")

# ---------------------------------------------------------------------------
# Section definitions: id, title, relevant content_tags, relevant categories
# ---------------------------------------------------------------------------

GUIDE_SECTIONS = [
    {
        "id": "overview",
        "title": "University Overview",
        "content_tags": [],
        "categories": ["about"],
        "icon": "building",
        "prompt": (
            "Write a compelling university overview paragraph. Include location, "
            "type (public/private), founding, size, and any notable rankings or "
            "distinctions. Use the page summaries below as source material."
        ),
    },
    {
        "id": "admission-requirements",
        "title": "Admission Requirements",
        "content_tags": [
            "admission_requirements", "gpa_requirements",
            "sat_requirements", "act_requirements", "ielts_requirements",
            "toefl_requirements", "duolingo_requirements", "test_optional_policy",
            "a_levels", "ib_scores", "national_exam_requirements",
            "language_proficiency", "holistic_review",
        ],
        "categories": ["admissions"],
        "icon": "clipboard-check",
        "prompt": (
            "Compile the admission requirements into clear subsections: "
            "GPA, standardized tests (SAT/ACT), English proficiency "
            "(TOEFL/IELTS/Duolingo), and any other requirements. "
            "Distinguish between undergraduate and graduate if info exists. "
            "Use bullet points and tables where appropriate."
        ),
    },
    {
        "id": "required-documents",
        "title": "Required Documents",
        "content_tags": [
            "required_documents", "transcript_requirements",
            "recommendation_letters", "personal_statement", "essay_prompts",
            "resume_cv", "portfolio", "interview_requirements",
            "certified_translations", "apostille", "notarization",
            "supplemental_materials", "writing_sample",
        ],
        "categories": ["admissions"],
        "icon": "file-text",
        "prompt": (
            "Create a checklist-style list of all required documents for "
            "application. Group by type (academic records, essays, "
            "recommendations, supplemental). Include any special requirements "
            "for international students."
        ),
    },
    {
        "id": "application-process",
        "title": "Application Process",
        "content_tags": [
            "application_process", "enrollment_steps", "early_decision",
            "early_action", "regular_decision", "rolling_admission",
            "transfer_admission", "graduate_admission",
            "conditional_admission", "direct_admission",
        ],
        "categories": ["admissions"],
        "icon": "list-ordered",
        "prompt": (
            "Outline the application process as numbered steps. Include "
            "information about different application rounds (Early Decision, "
            "Early Action, Regular Decision, Rolling). Mention the application "
            "platform (Common App, Coalition, etc.) if known."
        ),
    },
    {
        "id": "deadlines",
        "title": "Important Deadlines",
        "content_tags": [
            "application_deadlines", "application_deadline",
            "scholarship_deadline", "housing_deadline",
            "orientation_date", "semester_start", "registration_deadline",
            "deposit_deadline", "fafsa_deadline", "priority_deadline",
            "final_transcript_deadline", "document_deadlines",
        ],
        "categories": ["admissions"],
        "icon": "calendar",
        "prompt": (
            "Create a timeline of all important deadlines. Organize "
            "chronologically. Include application deadlines by round, "
            "financial aid deadlines, housing deadlines, and enrollment "
            "deposit deadlines. Use a table format."
        ),
    },
    {
        "id": "programs-majors",
        "title": "Programs & Majors",
        "content_tags": [
            "majors_list", "minors_list", "program_details",
            "curriculum", "degree_requirements", "credit_hours",
            "dual_degree", "online_programs", "honors_program",
            "certificate_programs", "accreditation",
        ],
        "categories": ["majors_programs", "academics"],
        "icon": "graduation-cap",
        "prompt": (
            "Summarize available programs and majors. Group by school/college "
            "if possible. Mention notable or popular programs. Include "
            "information about online options, honors programs, and dual "
            "degrees if available."
        ),
    },
    {
        "id": "tuition-fees",
        "title": "Tuition & Fees",
        "content_tags": [
            "tuition_fees", "room_and_board", "cost_of_attendance",
            "payment_plans", "fee_waivers", "refund_policy",
            "billing_info", "net_price_calculator",
        ],
        "categories": ["tuition_fees", "financial_aid"],
        "icon": "dollar-sign",
        "prompt": (
            "Create a clear breakdown of tuition and fees. Include "
            "in-state vs out-of-state if applicable, international student "
            "rates, room and board costs. Present as a comparison table "
            "where possible. Mention payment plans."
        ),
    },
    {
        "id": "scholarships-aid",
        "title": "Scholarships & Financial Aid",
        "content_tags": [
            "financial_aid", "merit_scholarships", "need_based_aid",
            "international_scholarships", "graduate_assistantships",
            "work_study", "scholarship_criteria", "funding_packages",
            "loan_information", "scholarship_deadlines",
        ],
        "categories": ["scholarships", "financial_aid"],
        "icon": "award",
        "prompt": (
            "List all scholarship and financial aid opportunities. "
            "Organize by type: merit-based, need-based, international-specific. "
            "Include eligibility criteria, amounts where known, and "
            "application deadlines."
        ),
    },
    {
        "id": "international-students",
        "title": "International Students",
        "content_tags": [
            "visa_information", "i20_process", "immigration_support",
            "international_student_services", "country_specific_requirements",
            "credential_evaluation", "wes_ece_requirements",
            "orientation_international", "esl_programs",
            "cultural_adjustment", "work_authorization", "opt_cpt",
            "international_admission",
        ],
        "categories": ["international"],
        "icon": "globe",
        "prompt": (
            "Compile all information relevant to international students. "
            "Include visa process, I-20, credential evaluation requirements, "
            "English language programs, international student services, and "
            "any country-specific requirements found."
        ),
    },
    {
        "id": "campus-life",
        "title": "Campus Life",
        "content_tags": [
            "campus_life", "housing", "dining", "clubs_organizations",
            "sports", "campus_tour", "virtual_tour", "campus_map",
            "facilities", "student_services", "health_services",
            "transportation",
        ],
        "categories": ["campus_life", "housing", "student_services"],
        "icon": "home",
        "prompt": (
            "Provide a brief overview of campus life including housing "
            "options, dining, student organizations, recreational facilities, "
            "and student services."
        ),
    },
    {
        "id": "contact-info",
        "title": "Contact Information",
        "content_tags": [
            "contact_info", "office_hours", "admission_email",
            "phone_number", "physical_address", "social_media",
            "live_chat", "mailing_address", "regional_representatives",
        ],
        "categories": ["contact"],
        "icon": "mail",
        "prompt": (
            "List all contact information for the admissions office and "
            "other relevant departments. Include email, phone, physical "
            "address, office hours, and social media links."
        ),
    },
    {
        "id": "faq",
        "title": "Frequently Asked Questions",
        "content_tags": ["faq"],
        "categories": [],
        "icon": "help-circle",
        "prompt": (
            "Generate 8-12 frequently asked questions and answers based on "
            "the information found across the website. Focus on questions "
            "an international prospective student would ask. If the website "
            "had an FAQ page, incorporate those questions."
        ),
    },
]


class AdmissionGuideGenerator:
    """
    Generates comprehensive admission guides from analyzed university data.
    Collects all relevant information from analyzed pages and structures it
    into a navigable guide format.
    """

    def __init__(self, db: AsyncIOMotorDatabase, university_id: str):
        self.db = db
        self.university_id = ObjectId(university_id)
        self._api_base = settings.AZURE_OPENAI_ENDPOINT.rstrip("/")
        self._model = settings.AZURE_OPENAI_MODEL
        self._api_key = settings.AZURE_OPENAI_API_KEY
        self._api_version = settings.AZURE_OPENAI_API_VERSION
        self._semaphore = asyncio.Semaphore(3)

    async def generate(self) -> dict[str, Any]:
        """Generate the full admission guide. Returns the guide document."""
        uni = await self.db.universities.find_one({"_id": self.university_id})
        if not uni:
            raise ValueError(f"University {self.university_id} not found")

        university_name = uni["name"]

        await self.db.guides.update_one(
            {"university_id": str(self.university_id)},
            {
                "$set": {
                    "university_id": str(self.university_id),
                    "university_name": university_name,
                    "status": "generating",
                    "generated_at": datetime.now(timezone.utc),
                }
            },
            upsert=True,
        )

        pages = []
        async for page in self.db.pages.find(
            {"university_id": self.university_id, "status": "analyzed"},
            {
                "url": 1, "ai_title": 1, "title": 1, "page_category": 1,
                "content_tags": 1, "ai_summary": 1, "raw_text": 1,
                "analyzed_at": 1,
            },
        ):
            pages.append(page)

        logger.info(
            "Generating guide for %s with %d analyzed pages",
            university_name, len(pages),
        )

        tasks = [
            self._generate_section(section_def, pages, university_name)
            for section_def in GUIDE_SECTIONS
        ]
        sections = await asyncio.gather(*tasks)

        missing_sections = [s["id"] for s in sections if s["status"] == "missing"]
        found_count = sum(1 for s in sections if s["status"] == "found")
        partial_count = sum(1 for s in sections if s["status"] == "partial")
        total = len(sections)
        completeness_score = round(
            ((found_count + partial_count * 0.5) / total) * 100, 1
        )

        guide_doc = {
            "university_id": str(self.university_id),
            "university_name": university_name,
            "generated_at": datetime.now(timezone.utc),
            "status": "completed",
            "sections": sections,
            "missing_sections": missing_sections,
            "completeness_score": completeness_score,
            "customization": {
                "primary_color": "#1e3a5f",
                "accent_color": "#3b82f6",
                "show_sources": True,
                "show_confidence": False,
                "show_missing_sections": True,
                "logo_url": uni.get("logo_url"),
                "custom_header": None,
                "target_audience": "international",
            },
        }

        await self.db.guides.update_one(
            {"university_id": str(self.university_id)},
            {"$set": guide_doc},
            upsert=True,
        )

        logger.info(
            "Guide generated for %s: %.0f%% complete, %d missing sections",
            university_name, completeness_score, len(missing_sections),
        )
        return guide_doc

    async def _generate_section(
        self,
        section_def: dict,
        all_pages: list[dict],
        university_name: str,
    ) -> dict[str, Any]:
        section_id = section_def["id"]
        section_title = section_def["title"]
        relevant_tags = section_def["content_tags"]
        relevant_categories = section_def["categories"]

        relevant_pages = []
        for page in all_pages:
            page_tags = page.get("content_tags", [])
            page_category = page.get("page_category", "")

            tag_match = any(t in relevant_tags for t in page_tags) if relevant_tags else False
            cat_match = page_category in relevant_categories if relevant_categories else False

            if tag_match or cat_match:
                relevant_pages.append(page)

        source_urls = list(set(p.get("url", "") for p in relevant_pages))

        if not relevant_pages:
            return {
                "id": section_id,
                "title": section_title,
                "content": "",
                "source_urls": [],
                "confidence": 0.0,
                "last_verified": None,
                "status": "missing",
                "subsections": [],
            }

        context_parts = []
        for page in relevant_pages[:15]:
            summary = page.get("ai_summary", "")
            raw_text = page.get("raw_text", "")
            content = summary if summary else (raw_text[:2000] if raw_text else "")
            if content:
                url = page.get("url", "")
                title = page.get("ai_title") or page.get("title", "")
                tags = ", ".join(page.get("content_tags", [])[:10])
                context_parts.append(
                    f"--- Page: {title} ---\nURL: {url}\nTags: {tags}\n{content}"
                )

        context = "\n\n".join(context_parts)
        if len(context) > 12000:
            context = context[:12000] + "\n...[truncated]..."

        content = await self._synthesize_section(
            section_title=section_title,
            section_prompt=section_def["prompt"],
            context=context,
            university_name=university_name,
        )

        if not content:
            status = "partial" if relevant_pages else "missing"
            fallback_parts = []
            for page in relevant_pages[:5]:
                s = page.get("ai_summary", "")
                if s:
                    fallback_parts.append(f"- {s}")
            content = "\n".join(fallback_parts) if fallback_parts else ""
        else:
            status = "found"

        confidence = min(1.0, len(relevant_pages) / 5) * 0.8
        if content and len(content) > 200:
            confidence += 0.2
        confidence = round(confidence, 2)

        verified_dates = [
            p["analyzed_at"]
            for p in relevant_pages
            if p.get("analyzed_at")
        ]
        last_verified = max(verified_dates) if verified_dates else None

        return {
            "id": section_id,
            "title": section_title,
            "content": content,
            "source_urls": source_urls[:10],
            "confidence": confidence,
            "last_verified": last_verified.isoformat() if last_verified else None,
            "status": status,
            "subsections": [],
        }

    async def _synthesize_section(
        self,
        section_title: str,
        section_prompt: str,
        context: str,
        university_name: str,
    ) -> Optional[str]:
        async with self._semaphore:
            system = (
                "You are a professional university admission guide writer. "
                "Your task is to synthesize information from multiple web pages "
                "into a clear, well-structured guide section. "
                "Write in a helpful, informative tone suitable for prospective students. "
                "Use markdown formatting: ## for subsection headers, **bold** for emphasis, "
                "- for bullet points, | for tables. "
                "Only include information found in the provided source pages. "
                "If information is unclear or contradictory, note it. "
                "Do NOT make up information that is not in the sources."
            )

            user_message = (
                f"University: {university_name}\n"
                f"Section: {section_title}\n\n"
                f"Instructions: {section_prompt}\n\n"
                f"Source pages:\n{context}"
            )

            return await self._call_openai(system, user_message)

    async def _call_openai(self, system: str, user_message: str) -> Optional[str]:
        url = f"{self._api_base}/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "api-key": self._api_key,
        }
        params = {"api-version": self._api_version}
        body = {
            "model": self._model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user_message},
            ],
            "max_completion_tokens": 2048,
            "temperature": 0.4,
        }

        retries = 3
        for attempt in range(retries):
            try:
                async with httpx.AsyncClient(timeout=90) as client:
                    resp = await client.post(
                        url, headers=headers, params=params, json=body
                    )
                    if resp.status_code == 429:
                        retry_after = int(resp.headers.get("retry-after", 5))
                        logger.warning("Rate limited, waiting %ds", retry_after)
                        await asyncio.sleep(retry_after)
                        continue
                    resp.raise_for_status()
                    data = resp.json()
                    choices = data.get("choices", [])
                    if choices:
                        return choices[0]["message"]["content"]
                    return None
            except Exception as exc:
                logger.error(
                    "OpenAI call failed (attempt %d): %s", attempt + 1, exc
                )
                if attempt < retries - 1:
                    await asyncio.sleep(2 ** attempt)

        return None


# ---------------------------------------------------------------------------
# Module-level convenience function
# ---------------------------------------------------------------------------


async def generate_guide(university_id: str, db: AsyncIOMotorDatabase) -> dict[str, Any]:
    from src.generator.html_renderer import render_guide_html

    generator = AdmissionGuideGenerator(db=db, university_id=university_id)
    guide_doc = await generator.generate()

    html = render_guide_html(guide_doc)

    sections_found = [s["id"] for s in guide_doc["sections"] if s["status"] == "found"]
    sections_partial = [s["id"] for s in guide_doc["sections"] if s["status"] == "partial"]
    sections_missing = [s["id"] for s in guide_doc["sections"] if s["status"] == "missing"]

    word_count = len(html.split())

    result = {
        "html": html,
        "sections_found": sections_found + sections_partial,
        "sections_missing": sections_missing,
        "completeness_score": guide_doc["completeness_score"],
        "word_count": word_count,
    }

    await db.guides.update_one(
        {"university_id": str(ObjectId(university_id))},
        {
            "$set": {
                "html": html,
                "word_count": word_count,
                "sections_found": result["sections_found"],
                "sections_missing": sections_missing,
            }
        },
    )

    return result
