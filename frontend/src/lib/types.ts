export type UniversityStatus =
  | 'pending'
  | 'crawling'
  | 'crawled'
  | 'analyzing'
  | 'completed'
  | 'failed';

export interface University {
  id: string;
  name: string;
  domains: string[];
  country: string;
  status: UniversityStatus;
  created_at: string;
  updated_at: string;
  pages_count: number;
  summary: UniversitySummary | null;
}

export interface UniversitySummary {
  overall_score: number;
  content_quality_score: number;
  navigation_score: number;
  completeness_score: number;
  accessibility_score: number;
  seo_score: number;
  freshness_score: number;
  total_pages: number;
  critical_issues: number;
  warnings: number;
  suggestions: number;
  avg_depth: number;
  max_depth: number;
  confusion_rate: number;
  international_readiness: number;
  top_issues: TopIssue[];
  category_completeness: Record<string, number>;
  country_coverage: CountryCoverage[];
  depth_distribution: Record<string, number>;
  category_distribution: Record<string, number>;
  nav_difficulty_distribution: Record<string, number>;
  tag_frequency: Record<string, number>;
}

export interface TopIssue {
  type: 'critical' | 'warning' | 'suggestion';
  category: string;
  description: string;
  affected_pages: number;
}

export interface CountryCoverage {
  country: string;
  language: string;
  pages: number;
  coverage_score: number;
}

export interface Page {
  id: string;
  university_id: string;
  url: string;
  original_title: string;
  ai_title: string;
  category: string;
  subcategory: string;
  depth: number;
  nav_difficulty: number;
  word_count: number;
  load_time: number;
  language: string;
  content_tags: string[];
  issue_tags: string[];
  quality_tags: string[];
  ai_summary: string;
  ai_improvements: AIImprovement[];
  headings: HeadingItem[];
  outgoing_links: OutgoingLink[];
  incoming_links_count: number;
  discovery_path: string[];
  has_dynamic_content: boolean;
  status_code: number;
  last_modified: string | null;
  created_at: string;
}

export interface AIImprovement {
  type: 'critical' | 'warning' | 'suggestion';
  category: string;
  description: string;
  impact: string;
}

export interface HeadingItem {
  level: number;
  text: string;
}

export interface OutgoingLink {
  url: string;
  text: string;
  location: 'header' | 'footer' | 'main' | 'sidebar' | 'breadcrumb';
}

export interface TreeNode {
  id: string;
  url: string;
  ai_title: string;
  category: string;
  depth: number;
  issue_count: number;
  issue_tags: string[];
  link_location: string;
  children: TreeNode[];
}

export interface GraphNode {
  id: string;
  url: string;
  ai_title: string;
  category: string;
  depth: number;
  incoming_links_count: number;
  issue_count: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  link_location: string;
  link_text: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface Metrics {
  university_id: string;
  scores: {
    overall: number;
    content_quality: number;
    navigation: number;
    completeness: number;
    accessibility: number;
    seo: number;
    freshness: number;
  };
  depth_distribution: Record<string, number>;
  category_distribution: Record<string, number>;
  nav_difficulty_distribution: Record<string, number>;
  issues_by_type: {
    critical: number;
    warning: number;
    suggestion: number;
  };
  country_coverage: CountryCoverage[];
  tag_frequency: Record<string, number>;
  category_completeness: Record<string, number>;
  information_depth: Record<string, number>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface PageFilters {
  category?: string;
  search?: string;
  min_depth?: number;
  max_depth?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface CreateUniversityPayload {
  name: string;
  domains: string[];
  country: string;
}

export interface Guide {
  id: string;
  university_id: string;
  html: string;
  sections_found: string[];
  sections_missing: string[];
  completeness_score: number;
  word_count: number;
  created_at: string;
}
