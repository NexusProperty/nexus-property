import { Button } from './ui/button';
import { Loader2, FileDown } from 'lucide-react';
import { useReportGeneration } from '@/hooks/useReportGeneration';

interface ReportGenerationButtonProps {
  appraisalId: string;
  reportUrl?: string | null;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  label?: string;
  className?: string;
  onReportGenerated?: (reportUrl: string) => void;
}

/**
 * Button component for generating and downloading PDF reports
 * Uses the useReportGeneration hook to separate UI from business logic
 */
export default function ReportGenerationButton({
  appraisalId,
  reportUrl,
  variant = 'default',
  size = 'default',
  label = 'Download Report',
  className = '',
  onReportGenerated
}: ReportGenerationButtonProps) {
  const { isGenerating, generateReport } = useReportGeneration({
    appraisalId,
    initialReportUrl: reportUrl,
    onReportGenerated
  });

  return (
    <Button
      variant={variant}
      size={size}
      onClick={generateReport}
      disabled={isGenerating}
      className={className}
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <FileDown className="mr-2 h-4 w-4" />
          {label}
        </>
      )}
    </Button>
  );
} 