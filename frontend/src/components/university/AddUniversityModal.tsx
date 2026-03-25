import { useState } from 'react';
import { useCreateUniversity } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Globe, Building2, MapPin } from 'lucide-react';

interface AddUniversityModalProps {
  open: boolean;
  onClose: () => void;
}

const countries = [
  { code: 'US', name: 'United States' },
  { code: 'UK', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'SE', name: 'Sweden' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'CN', name: 'China' },
  { code: 'IN', name: 'India' },
  { code: 'SG', name: 'Singapore' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'BR', name: 'Brazil' },
  { code: 'KZ', name: 'Kazakhstan' },
];

export default function AddUniversityModal({
  open,
  onClose,
}: AddUniversityModalProps) {
  const [name, setName] = useState('');
  const [domains, setDomains] = useState('');
  const [country, setCountry] = useState('US');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const createUniversity = useCreateUniversity();

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'University name is required';
    if (!domains.trim()) errs.domains = 'At least one domain is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const domainList = domains
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);

    try {
      await createUniversity.mutateAsync({
        name: name.trim(),
        domains: domainList,
        country,
      });
      setName('');
      setDomains('');
      setCountry('US');
      setErrors({});
      onClose();
    } catch {
      setErrors({ submit: 'Failed to create university. Please try again.' });
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add University" size="md">
      <div className="space-y-4">
        <Input
          label="University Name"
          placeholder="e.g., Harvard University"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          icon={<Building2 className="w-4 h-4" />}
        />

        <Input
          label="Domains"
          placeholder="e.g., harvard.edu, admissions.harvard.edu"
          value={domains}
          onChange={(e) => setDomains(e.target.value)}
          error={errors.domains}
          icon={<Globe className="w-4 h-4" />}
        />
        <p className="text-xs text-muted-foreground -mt-2">
          Separate multiple domains with commas
        </p>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">
            Country
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            >
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {errors.submit && (
          <p className="text-sm text-red-500">{errors.submit}</p>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={createUniversity.isPending}
          >
            Add University
          </Button>
        </div>
      </div>
    </Modal>
  );
}
