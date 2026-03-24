import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function formatScore(score: number): string {
  return Math.round(score).toString();
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-500';
  if (score >= 60) return 'text-amber-500';
  if (score >= 40) return 'text-orange-500';
  return 'text-red-500';
}

export function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-amber-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Poor';
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'success';
    case 'crawling':
    case 'analyzing':
      return 'info';
    case 'pending':
    case 'crawled':
      return 'warning';
    case 'failed':
      return 'critical';
    default:
      return 'default';
  }
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    admissions: '#6366F1',
    financial_aid: '#8B5CF6',
    academics: '#06B6D4',
    student_life: '#10B981',
    housing: '#F59E0B',
    international: '#EC4899',
    athletics: '#EF4444',
    research: '#14B8A6',
    about: '#64748B',
    contact: '#84CC16',
    events: '#F97316',
    news: '#3B82F6',
    library: '#A855F7',
    careers: '#22D3EE',
    alumni: '#D946EF',
    other: '#71717A',
  };
  return colors[category] || '#71717A';
}

export function countryToEmoji(countryCode: string): string {
  const countries: Record<string, string> = {
    US: '\u{1F1FA}\u{1F1F8}',
    UK: '\u{1F1EC}\u{1F1E7}',
    GB: '\u{1F1EC}\u{1F1E7}',
    CA: '\u{1F1E8}\u{1F1E6}',
    AU: '\u{1F1E6}\u{1F1FA}',
    DE: '\u{1F1E9}\u{1F1EA}',
    FR: '\u{1F1EB}\u{1F1F7}',
    JP: '\u{1F1EF}\u{1F1F5}',
    KR: '\u{1F1F0}\u{1F1F7}',
    CN: '\u{1F1E8}\u{1F1F3}',
    IN: '\u{1F1EE}\u{1F1F3}',
    BR: '\u{1F1E7}\u{1F1F7}',
    NL: '\u{1F1F3}\u{1F1F1}',
    SE: '\u{1F1F8}\u{1F1EA}',
    CH: '\u{1F1E8}\u{1F1ED}',
    SG: '\u{1F1F8}\u{1F1EC}',
    HK: '\u{1F1ED}\u{1F1F0}',
    NZ: '\u{1F1F3}\u{1F1FF}',
    IE: '\u{1F1EE}\u{1F1EA}',
    IT: '\u{1F1EE}\u{1F1F9}',
    ES: '\u{1F1EA}\u{1F1F8}',
    KZ: '\u{1F1F0}\u{1F1FF}',
  };
  return countries[countryCode.toUpperCase()] || '\u{1F30D}';
}
