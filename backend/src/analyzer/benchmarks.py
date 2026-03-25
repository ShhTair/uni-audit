"""
Benchmark data for competitor comparison analysis.
Contains baseline metrics from well-known university tiers,
content completeness checklists, and country qualification mappings.
"""

from typing import Any

# Average metrics from well-known universities (manually researched baseline)
BENCHMARK_DATA: dict[str, dict[str, Any]] = {
    "top_50_global": {
        "overall_score": 78,
        "content_quality": 82,
        "navigation": 75,
        "completeness": 80,
        "accessibility": 70,
        "seo": 72,
        "freshness": 68,
        "avg_depth_to_key_info": 2.3,
        "pages_analyzed": 150,
    },
    "top_200_global": {
        "overall_score": 65,
        "content_quality": 70,
        "navigation": 60,
        "completeness": 65,
        "accessibility": 55,
        "seo": 58,
        "freshness": 52,
        "avg_depth_to_key_info": 3.1,
        "pages_analyzed": 100,
    },
    "regional_average": {
        "overall_score": 48,
        "content_quality": 52,
        "navigation": 42,
        "completeness": 45,
        "accessibility": 38,
        "seo": 40,
        "freshness": 35,
        "avg_depth_to_key_info": 4.2,
        "pages_analyzed": 80,
    },
}

# Expected content for a complete admission site
COMPLETE_ADMISSION_CHECKLIST: dict[str, list[str]] = {
    "essential": [
        "admission_requirements",
        "application_process",
        "application_deadlines",
        "tuition_fees",
        "required_documents",
        "majors_list",
        "contact_info",
        "international_admission",
        "financial_aid",
        "scholarship_criteria",
    ],
    "important": [
        "gpa_requirements",
        "ielts_requirements",
        "toefl_requirements",
        "sat_requirements",
        "recommendation_letters",
        "personal_statement",
        "visa_information",
        "housing",
        "cost_of_attendance",
        "payment_plans",
        "program_details",
        "degree_requirements",
        "faq",
    ],
    "nice_to_have": [
        "virtual_tour",
        "campus_map",
        "career_services",
        "alumni_network",
        "clubs_organizations",
        "class_size",
        "faculty_info",
        "research_opportunities",
        "dual_degree",
        "online_programs",
        "internships",
        "job_placement",
        "live_chat",
        "calculator_tool",
    ],
}

# Major student-sending countries and their standard qualifications
COUNTRY_QUALIFICATIONS: dict[str, list[str]] = {
    "Kazakhstan": ["UNT", "ENT", "Attestat", "NIS_grades"],
    "India": ["12th_standard", "CBSE", "ICSE", "JEE", "NEET", "state_board"],
    "China": ["Gaokao", "Huikao", "Senior_High_School_Diploma"],
    "South Korea": ["CSAT", "Suneung", "Korean_GPA"],
    "Vietnam": ["National_High_School_Exam", "Vietnamese_Diploma"],
    "Nigeria": ["WAEC", "NECO", "JAMB", "UTME"],
    "Turkey": ["YKS", "TYT", "AYT", "Lise_Diplomasi"],
    "Saudi Arabia": ["Tawjihi", "Qudurat", "Tahsili"],
    "Pakistan": ["Matric", "Intermediate", "A_Levels_Pakistan", "HSSC"],
    "Bangladesh": ["HSC", "SSC", "Alim"],
    "Indonesia": ["UN", "SBMPTN", "SMA_Diploma"],
    "Japan": ["EJU", "Center_Test", "JLPT"],
    "Brazil": ["ENEM", "Vestibular"],
    "Mexico": ["Certificado_Bachillerato", "CENEVAL"],
    "Egypt": ["Thanaweya_Amma"],
    "Iran": ["Konkur", "Pre_University_Diploma"],
    "Nepal": ["SLC", "SEE", "+2_Certificate"],
    "Sri_Lanka": ["GCE_AL_SL", "GCE_OL_SL"],
    "Ghana": ["WASSCE"],
    "Kenya": ["KCSE"],
    "Ethiopia": ["EUEE", "Ethiopian_University_Entrance"],
    "Philippines": ["College_Entrance_Tests"],
    "Malaysia": ["SPM", "STPM", "UEC"],
    "Thailand": ["O_NET", "GAT_PAT"],
    "Taiwan": ["GSAT", "AST"],
    "UAE": ["EmSAT"],
    "Jordan": ["Tawjihi_Jordan"],
    "Lebanon": ["Baccalaureate_Libanais"],
    "Morocco": ["Baccalauréat_Marocain"],
    "Tunisia": ["Baccalauréat_Tunisien"],
    "Uzbekistan": ["DTM"],
    "Kyrgyzstan": ["ORT"],
    "Tajikistan": ["National_Exam_TJ"],
    "Georgia": ["Erovnuli_Gamocdebis"],
    "Azerbaijan": ["DIM"],
    "Armenia": ["State_Exam_AM"],
}

# Priority sending countries (highest volume of international students globally)
PRIORITY_SENDING_COUNTRIES: list[str] = [
    "Kazakhstan",
    "India",
    "China",
    "Nigeria",
    "Vietnam",
    "South Korea",
    "Turkey",
    "Saudi Arabia",
]

# Score category keys that map to benchmark data
SCORE_CATEGORY_KEYS: list[str] = [
    "overall_score",
    "content_quality",
    "navigation",
    "completeness",
    "accessibility",
    "seo",
    "freshness",
]
