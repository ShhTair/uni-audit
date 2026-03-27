import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  University,
  Page,
  TreeNode,
  GraphData,
  Metrics,
  PaginatedResponse,
  PageFilters,
  CreateUniversityPayload,
  Guide,
} from './types';

// Hard fix for Mixed Content: Force relative path in production so Vercel Rewrites catch it.
// If we are in dev, use VITE_API_URL or localhost.
const API_URL = import.meta.env.DEV ? (import.meta.env.VITE_API_URL || "http://localhost:8000") : "";
 


async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Network error' }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

export function useUniversities() {
  return useQuery<University[]>({
    queryKey: ['universities'],
    queryFn: () => apiFetch<University[]>('/api/universities'),
  });
}

export function useUniversity(id: string) {
  return useQuery<University>({
    queryKey: ['university', id],
    queryFn: () => apiFetch<University>(`/api/universities/${id}`),
    enabled: !!id,
  });
}

export function useUniversityPages(id: string, filters: PageFilters = {}) {
  const params = new URLSearchParams();
  if (filters.category) params.set('category', filters.category);
  if (filters.search) params.set('search', filters.search);
  if (filters.min_depth !== undefined) params.set('min_depth', String(filters.min_depth));
  if (filters.max_depth !== undefined) params.set('max_depth', String(filters.max_depth));
  if (filters.sort_by) params.set('sort_by', filters.sort_by);
  if (filters.sort_order) params.set('sort_order', filters.sort_order);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.per_page) params.set('per_page', String(filters.per_page));

  const query = params.toString();
  return useQuery<PaginatedResponse<Page>>({
    queryKey: ['university-pages', id, filters],
    queryFn: () =>
      apiFetch<PaginatedResponse<Page>>(
        `/api/universities/${id}/pages${query ? `?${query}` : ''}`
      ),
    enabled: !!id,
  });
}

export function useUniversityTree(id: string) {
  return useQuery<TreeNode>({
    queryKey: ['university-tree', id],
    queryFn: () => apiFetch<TreeNode>(`/api/universities/${id}/tree`),
    enabled: !!id,
  });
}

export function useUniversityGraph(id: string) {
  return useQuery<GraphData>({
    queryKey: ['university-graph', id],
    queryFn: () => apiFetch<GraphData>(`/api/universities/${id}/graph`),
    enabled: !!id,
  });
}

export function useUniversityMetrics(id: string) {
  return useQuery<Metrics>({
    queryKey: ['university-metrics', id],
    queryFn: () => apiFetch<Metrics>(`/api/universities/${id}/metrics`),
    enabled: !!id,
  });
}

export function usePage(uniId: string, pageId: string) {
  return useQuery<Page>({
    queryKey: ['page', uniId, pageId],
    queryFn: () => apiFetch<Page>(`/api/universities/${uniId}/pages/${pageId}`),
    enabled: !!uniId && !!pageId,
  });
}

export function useCreateUniversity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUniversityPayload) =>
      apiFetch<University>('/api/universities', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['universities'] });
    },
  });
}

export function useStartCrawl() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<University>(`/api/universities/${id}/crawl`, {
        method: 'POST',
      }),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['university', id] });
      queryClient.invalidateQueries({ queryKey: ['universities'] });
    },
  });
}

export function useStartAnalysis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<University>(`/api/universities/${id}/analyze`, {
        method: 'POST',
      }),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['university', id] });
      queryClient.invalidateQueries({ queryKey: ['universities'] });
    },
  });
}

export function useDeleteUniversity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/api/universities/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['universities'] });
    },
  });
}

export function useGuide(universityId: string) {
  return useQuery<Guide>({
    queryKey: ['guide', universityId],
    queryFn: () => apiFetch<Guide>(`/api/universities/${universityId}/guide`),
    enabled: !!universityId,
    retry: false,
  });
}

export function useGenerateGuide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (universityId: string) =>
      apiFetch<Guide>(`/api/universities/${universityId}/generate-guide`, {
        method: 'POST',
      }),
    onSuccess: (_data, universityId) => {
      queryClient.invalidateQueries({ queryKey: ['guide', universityId] });
    },
  });
}
