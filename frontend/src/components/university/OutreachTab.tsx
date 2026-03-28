import { useState } from 'react';
import { Mail, Copy, Check, Sparkles, User, Briefcase } from 'lucide-react';
import { useGenerateOutreach } from '@/lib/api';
import type { OutreachRequest, OutreachResult } from '@/lib/types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';

const TONE_OPTIONS: { value: OutreachRequest['tone']; label: string; desc: string }[] = [
  { value: 'professional', label: 'Professional', desc: 'Formal, data-driven' },
  { value: 'consultative', label: 'Consultative', desc: 'Advisory, trust-building' },
  { value: 'friendly', label: 'Friendly', desc: 'Warm, conversational' },
];

interface Props {
  universityId: string;
  universityName: string;
  hasAuditData: boolean;
}

export default function OutreachTab({ universityId, universityName, hasAuditData }: Props) {
  const [contactName, setContactName] = useState('');
  const [contactTitle, setContactTitle] = useState('Head of Admissions');
  const [tone, setTone] = useState<OutreachRequest['tone']>('professional');
  const [result, setResult] = useState<OutreachResult | null>(null);
  const [copied, setCopied] = useState<'subject' | 'body' | 'full' | null>(null);

  const generate = useGenerateOutreach();

  const handleGenerate = () => {
    if (!contactName.trim()) return;
    generate.mutate(
      { universityId, req: { contact_name: contactName, contact_title: contactTitle, tone } },
      { onSuccess: (data) => setResult(data) }
    );
  };

  const copyText = (text: string, key: 'subject' | 'body' | 'full') => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  };

  if (!hasAuditData) {
    return (
      <Card variant="default" padding="lg">
        <div className="flex flex-col items-center py-10 text-center">
          <div className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center mb-4">
            <Mail className="w-5 h-5 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">Audit Required</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Complete a crawl and analysis for {universityName} to generate personalised outreach emails.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Form */}
      <Card variant="default" padding="lg">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Generate Cold Pitch Email
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Contact Name *
            </label>
            <Input
              placeholder="e.g. Sarah Mitchell"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              icon={<User className="w-4 h-4" />}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Contact Title
            </label>
            <Input
              placeholder="Head of Admissions"
              value={contactTitle}
              onChange={(e) => setContactTitle(e.target.value)}
              icon={<Briefcase className="w-4 h-4" />}
            />
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-xs font-medium text-muted-foreground mb-2">Tone</label>
          <div className="flex gap-2 flex-wrap">
            {TONE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTone(opt.value)}
                className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                  tone === opt.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground hover:border-border/80'
                }`}
              >
                <span className="font-medium">{opt.label}</span>
                <span className="ml-1.5 text-xs opacity-70">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <Button
          variant="primary"
          icon={<Sparkles className="w-4 h-4" />}
          onClick={handleGenerate}
          loading={generate.isPending}
          disabled={!contactName.trim()}
        >
          Generate Email
        </Button>

        {generate.error && (
          <p className="mt-3 text-sm text-red-500">
            {(generate.error as Error).message || 'Generation failed.'}
          </p>
        )}
      </Card>

      {/* Result */}
      {result && (
        <Card variant="default" padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              Generated Email — {result.contact_name}
            </h3>
            <button
              onClick={() => copyText(`Subject: ${result.subject}\n\n${result.body}`, 'full')}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {copied === 'full' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied === 'full' ? 'Copied!' : 'Copy all'}
            </button>
          </div>

          {/* Subject */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Subject</span>
              <button
                onClick={() => copyText(result.subject, 'subject')}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                {copied === 'subject' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                {copied === 'subject' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="rounded-lg bg-card border border-border px-3 py-2.5 text-sm text-foreground font-medium">
              {result.subject}
            </div>
          </div>

          {/* Body */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Body</span>
              <button
                onClick={() => copyText(result.body, 'body')}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                {copied === 'body' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                {copied === 'body' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="rounded-lg bg-card border border-border px-4 py-3 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {result.body}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border flex items-center gap-4 text-xs text-muted-foreground">
            <span>Audit score: <span className="text-foreground font-medium">{result.audit_score}/100</span></span>
            <span>Tone: <span className="text-foreground font-medium capitalize">{result.tone}</span></span>
          </div>
        </Card>
      )}
    </div>
  );
}
