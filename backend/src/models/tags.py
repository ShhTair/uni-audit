"""
Complete tag taxonomy for university website analysis.
Three main categories: CONTENT_TAGS, ISSUE_TAGS, QUALITY_TAGS.
"""

# ---------------------------------------------------------------------------
# CONTENT_TAGS - What information is present on the page (80+ tags)
# ---------------------------------------------------------------------------

CONTENT_TAGS_ADMISSIONS = [
    "admission_requirements",
    "application_process",
    "application_deadlines",
    "early_decision",
    "early_action",
    "regular_decision",
    "rolling_admission",
    "transfer_admission",
    "graduate_admission",
    "international_admission",
    "admission_statistics",
    "acceptance_rate",
    "enrollment_steps",
    "waitlist_info",
    "deferred_admission",
    "conditional_admission",
    "direct_admission",
    "holistic_review",
]

CONTENT_TAGS_TESTING = [
    "sat_requirements",
    "act_requirements",
    "gre_requirements",
    "gmat_requirements",
    "ielts_requirements",
    "toefl_requirements",
    "duolingo_requirements",
    "ap_scores",
    "ib_scores",
    "a_levels",
    "national_exam_requirements",
    "test_optional_policy",
    "test_waivers",
    "language_proficiency",
    "placement_tests",
    "sat_subject_tests",
]

CONTENT_TAGS_FINANCIAL = [
    "tuition_fees",
    "room_and_board",
    "cost_of_attendance",
    "financial_aid",
    "merit_scholarships",
    "need_based_aid",
    "international_scholarships",
    "graduate_assistantships",
    "work_study",
    "payment_plans",
    "fee_waivers",
    "scholarship_deadlines",
    "scholarship_criteria",
    "funding_packages",
    "loan_information",
    "net_price_calculator",
    "refund_policy",
    "billing_info",
]

CONTENT_TAGS_ACADEMIC = [
    "majors_list",
    "minors_list",
    "program_details",
    "curriculum",
    "course_catalog",
    "degree_requirements",
    "credit_hours",
    "gpa_requirements",
    "class_size",
    "faculty_info",
    "research_opportunities",
    "dual_degree",
    "online_programs",
    "accreditation",
    "honors_program",
    "study_abroad",
    "certificate_programs",
    "continuing_education",
    "academic_calendar",
    "grading_policy",
]

CONTENT_TAGS_DOCUMENTS = [
    "required_documents",
    "transcript_requirements",
    "recommendation_letters",
    "personal_statement",
    "essay_prompts",
    "resume_cv",
    "portfolio",
    "interview_requirements",
    "document_deadlines",
    "certified_translations",
    "apostille",
    "notarization",
    "supplemental_materials",
    "writing_sample",
]

CONTENT_TAGS_CAMPUS = [
    "campus_life",
    "housing",
    "dining",
    "clubs_organizations",
    "sports",
    "campus_tour",
    "virtual_tour",
    "campus_map",
    "facilities",
    "library",
    "labs",
    "student_services",
    "health_services",
    "counseling",
    "transportation",
    "parking",
    "safety_security",
]

CONTENT_TAGS_INTERNATIONAL = [
    "visa_information",
    "i20_process",
    "immigration_support",
    "international_student_services",
    "country_specific_requirements",
    "credential_evaluation",
    "wes_ece_requirements",
    "orientation_international",
    "esl_programs",
    "cultural_adjustment",
    "work_authorization",
    "opt_cpt",
]

CONTENT_TAGS_CAREER = [
    "career_services",
    "internships",
    "job_placement",
    "alumni_network",
    "employer_partnerships",
    "career_outcomes",
    "salary_data",
    "career_fairs",
    "resume_workshops",
    "mock_interviews",
]

CONTENT_TAGS_CONTACT = [
    "contact_info",
    "office_hours",
    "admission_email",
    "phone_number",
    "physical_address",
    "social_media",
    "live_chat",
    "faq",
    "mailing_address",
    "regional_representatives",
]

CONTENT_TAGS_DEADLINES = [
    "application_deadline",
    "scholarship_deadline",
    "housing_deadline",
    "orientation_date",
    "semester_start",
    "registration_deadline",
    "deposit_deadline",
    "fafsa_deadline",
    "priority_deadline",
    "final_transcript_deadline",
]

ALL_CONTENT_TAGS = (
    CONTENT_TAGS_ADMISSIONS
    + CONTENT_TAGS_TESTING
    + CONTENT_TAGS_FINANCIAL
    + CONTENT_TAGS_ACADEMIC
    + CONTENT_TAGS_DOCUMENTS
    + CONTENT_TAGS_CAMPUS
    + CONTENT_TAGS_INTERNATIONAL
    + CONTENT_TAGS_CAREER
    + CONTENT_TAGS_CONTACT
    + CONTENT_TAGS_DEADLINES
)

CONTENT_TAG_GROUPS = {
    "admissions": CONTENT_TAGS_ADMISSIONS,
    "testing": CONTENT_TAGS_TESTING,
    "financial": CONTENT_TAGS_FINANCIAL,
    "academic": CONTENT_TAGS_ACADEMIC,
    "documents": CONTENT_TAGS_DOCUMENTS,
    "campus": CONTENT_TAGS_CAMPUS,
    "international": CONTENT_TAGS_INTERNATIONAL,
    "career": CONTENT_TAGS_CAREER,
    "contact": CONTENT_TAGS_CONTACT,
    "deadlines": CONTENT_TAGS_DEADLINES,
}

# ---------------------------------------------------------------------------
# ISSUE_TAGS - Problems found on the page (40+ tags)
# ---------------------------------------------------------------------------

ISSUE_TAGS_CONTENT = [
    "outdated_information",
    "broken_link",
    "missing_information",
    "contradictory_information",
    "vague_requirements",
    "incomplete_list",
    "dead_end_page",
    "duplicate_content",
    "placeholder_content",
    "lorem_ipsum",
    "stale_dates",
    "wrong_year",
    "ambiguous_instructions",
]

ISSUE_TAGS_ACCESSIBILITY = [
    "image_instead_of_text",
    "no_alt_text",
    "poor_contrast",
    "tiny_text",
    "pdf_only_content",
    "requires_login",
    "broken_pdf",
    "no_mobile_version",
    "captcha_barrier",
    "javascript_required",
    "screen_reader_unfriendly",
    "keyboard_nav_broken",
]

ISSUE_TAGS_NAVIGATION = [
    "deep_buried_content",
    "circular_links",
    "no_breadcrumbs",
    "inconsistent_navigation",
    "orphan_page",
    "misleading_link_text",
    "too_many_clicks",
    "no_search",
    "broken_navigation",
    "confusing_menu",
    "dead_end_navigation",
]

ISSUE_TAGS_TECHNICAL = [
    "slow_loading",
    "error_404",
    "mixed_content",
    "no_ssl",
    "broken_form",
    "no_sitemap",
    "poor_seo",
    "no_meta_description",
    "missing_headings",
    "broken_embed",
    "redirect_chain",
    "server_error",
]

ISSUE_TAGS_UX = [
    "wall_of_text",
    "no_visual_hierarchy",
    "cluttered_layout",
    "popup_overload",
    "auto_playing_media",
    "confusing_terminology",
    "jargon_heavy",
    "no_translation",
    "inconsistent_styling",
    "poor_typography",
    "overwhelming_options",
]

ALL_ISSUE_TAGS = (
    ISSUE_TAGS_CONTENT
    + ISSUE_TAGS_ACCESSIBILITY
    + ISSUE_TAGS_NAVIGATION
    + ISSUE_TAGS_TECHNICAL
    + ISSUE_TAGS_UX
)

ISSUE_TAG_GROUPS = {
    "content": ISSUE_TAGS_CONTENT,
    "accessibility": ISSUE_TAGS_ACCESSIBILITY,
    "navigation": ISSUE_TAGS_NAVIGATION,
    "technical": ISSUE_TAGS_TECHNICAL,
    "ux": ISSUE_TAGS_UX,
}

# ---------------------------------------------------------------------------
# QUALITY_TAGS - Positive markers (20+ tags)
# ---------------------------------------------------------------------------

ALL_QUALITY_TAGS = [
    "well_structured",
    "clear_steps",
    "visual_aids",
    "calculator_tool",
    "comparison_table",
    "timeline_visual",
    "checklist_format",
    "multilingual",
    "video_content",
    "interactive_content",
    "regularly_updated",
    "comprehensive_faq",
    "downloadable_resources",
    "chat_support",
    "personalized_content",
    "infographic",
    "search_functionality",
    "responsive_design",
    "fast_loading",
    "clear_cta",
    "testimonials",
    "data_driven",
    "easy_to_scan",
    "accessible_design",
    "mobile_optimized",
    "social_proof",
    "step_by_step_guide",
]

# ---------------------------------------------------------------------------
# PAGE_CATEGORIES
# ---------------------------------------------------------------------------

PAGE_CATEGORIES = [
    "admissions",
    "scholarships",
    "financial_aid",
    "tuition_fees",
    "majors_programs",
    "academics",
    "campus_life",
    "housing",
    "international",
    "graduate",
    "transfer",
    "about",
    "contact",
    "news",
    "events",
    "career_services",
    "research",
    "athletics",
    "alumni",
    "student_services",
    "library",
    "technology",
    "diversity",
    "safety",
    "health",
    "other",
]

# ---------------------------------------------------------------------------
# LINK_LOCATIONS
# ---------------------------------------------------------------------------

LINK_LOCATIONS = [
    "header",
    "footer",
    "sidebar",
    "main_content",
    "breadcrumb",
    "inline",
    "button",
    "carousel",
    "modal",
    "dropdown",
]

# ---------------------------------------------------------------------------
# Expected tags per category for completeness scoring
# ---------------------------------------------------------------------------

EXPECTED_TAGS_BY_CATEGORY = {
    "admissions": [
        "admission_requirements",
        "application_process",
        "application_deadlines",
        "enrollment_steps",
        "required_documents",
        "contact_info",
    ],
    "scholarships": [
        "scholarship_criteria",
        "scholarship_deadlines",
        "merit_scholarships",
        "need_based_aid",
        "international_scholarships",
        "application_process",
    ],
    "financial_aid": [
        "financial_aid",
        "cost_of_attendance",
        "tuition_fees",
        "payment_plans",
        "net_price_calculator",
        "fee_waivers",
    ],
    "majors_programs": [
        "majors_list",
        "program_details",
        "degree_requirements",
        "curriculum",
        "credit_hours",
        "faculty_info",
    ],
    "international": [
        "visa_information",
        "i20_process",
        "credential_evaluation",
        "country_specific_requirements",
        "language_proficiency",
        "international_student_services",
    ],
    "campus_life": [
        "housing",
        "dining",
        "clubs_organizations",
        "campus_map",
        "facilities",
        "student_services",
    ],
}

# Navigation difficulty weights by link location
LINK_LOCATION_WEIGHTS = {
    "header": 0.1,
    "breadcrumb": 0.15,
    "main_content": 0.2,
    "inline": 0.25,
    "sidebar": 0.3,
    "footer": 0.4,
    "button": 0.5,
    "dropdown": 0.5,
    "carousel": 0.6,
    "modal": 0.7,
}
