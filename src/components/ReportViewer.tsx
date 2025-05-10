import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Loader2, Download, ExternalLink } from 'lucide-react';
import { reportGenerationService } from '../services/reportGenerationService';

interface ReportViewerProps {
  appraisalId: string;
  className?: string;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({
  appraisalId,
  className = '',
}) => {
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReportUrl = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const url = await reportGenerationService.getReportUrl(appraisalId);
        setReportUrl(url);
      } catch (err) {
        console.error('Error fetching report URL:', err);
        setError('Failed to load report');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReportUrl();
  }, [appraisalId]);

  const handleDownload = async () => {
    if (!reportUrl) return;
    
    try {
      await reportGenerationService.downloadReport(reportUrl, `appraisal-${appraisalId}.pdf`);
    } catch (err) {
      console.error('Error downloading report:', err);
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">Loading report...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  if (!reportUrl) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
        <p className="text-gray-500 mb-4">No report available for this appraisal.</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex justify-end mb-4">
        <Button onClick={handleDownload} variant="outline" className="mr-2">
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
        <Button asChild variant="outline">
          <a href={reportUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            Open in New Tab
          </a>
        </Button>
      </div>
      
      <div className="w-full h-[800px] border border-gray-200 rounded-md overflow-hidden">
        <iframe
          src={reportUrl}
          title="Appraisal Report"
          className="w-full h-full"
          sandbox="allow-same-origin allow-scripts allow-forms"
        />
      </div>
    </div>
  );
}; 