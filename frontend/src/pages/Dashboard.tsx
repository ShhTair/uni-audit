import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Globe, FileText, AlertCircle, AlertTriangle, GraduationCap } from 'lucide-react';
import { useUniversities } from '@/lib/api';
import { PageHeader } from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import ScoreGauge from '@/components/ui/ScoreGauge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import AddUniversityModal from '@/components/university/AddUniversityModal';
import { countryToEmoji, getStatusColor, formatDateShort } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Dashboard() {
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  const { data: universities, isLoading, error } = useUniversities();

  return (
    <>
      <PageHeader
        title="Universities"
        subtitle="Monitor and audit university admission websites"
        actions={
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setModalOpen(true)}
          >
            Add University
          </Button>
        }
      />

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <p className="text-red-500 text-sm">
            Failed to load universities. Please check your API connection.
          </p>
        </div>
      )}

      {!isLoading && universities && universities.length === 0 && (
        <EmptyState
          icon={GraduationCap}
          title="No universities yet"
          description="Add your first university to start auditing their admission website."
          action={{ label: 'Add University', onClick: () => setModalOpen(true) }}
        />
      )}

      {!isLoading && universities && universities.length > 0 && (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {universities.map((uni) => (
            <motion.div key={uni.id} variants={itemVariants}>
              <Card
                hoverable
                variant="default"
                padding="md"
                onClick={() => navigate(`/university/${uni.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xl shrink-0">
                      {countryToEmoji(uni.country)}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {uni.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {uni.domains.length} domain{uni.domains.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={getStatusColor(uni.status) as 'success' | 'warning' | 'critical' | 'info' | 'default'}
                    size="sm"
                  >
                    {uni.status}
                  </Badge>
                </div>

                {uni.summary && uni.status === 'completed' && (
                  <>
                    <div className="flex items-center justify-center my-4">
                      <ScoreGauge
                        score={uni.summary.overall_score}
                        size="sm"
                        label="Overall"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <div className="flex items-center justify-center gap-1 text-muted-foreground">
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                          {uni.summary.total_pages}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Pages
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1 text-red-500">
                          <AlertCircle className="w-3.5 h-3.5" />
                        </div>
                        <p className="text-sm font-semibold text-red-500">
                          {uni.summary.critical_issues}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Critical
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center justify-center gap-1 text-amber-500">
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </div>
                        <p className="text-sm font-semibold text-amber-500">
                          {uni.summary.warnings}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Warnings
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {!uni.summary && (
                  <div className="py-6 text-center">
                    <p className="text-xs text-muted-foreground">
                      {uni.status === 'pending'
                        ? 'Waiting to start crawl'
                        : uni.status === 'crawling'
                        ? 'Crawling in progress...'
                        : uni.status === 'analyzing'
                        ? 'Analyzing pages...'
                        : uni.status === 'failed'
                        ? 'Audit failed'
                        : 'Processing...'}
                    </p>
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">
                    Added {formatDateShort(uni.created_at)}
                  </span>
                  <span className="text-xs text-primary font-medium">
                    View Details
                  </span>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      <AddUniversityModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
