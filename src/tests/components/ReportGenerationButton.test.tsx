import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { render } from '@/tests/utils/test-utils';
import ReportGenerationButton from '@/components/ReportGenerationButton';
import * as reportGenerationHook from '@/hooks/useReportGeneration';

// Mock the useReportGeneration hook
vi.mock('@/hooks/useReportGeneration', () => ({
  useReportGeneration: vi.fn(),
}));

// Mock window.open
const mockWindowOpen = vi.fn();
window.open = mockWindowOpen;

describe('ReportGenerationButton Component', () => {
  // Define some test data
  const mockAppraisalId = 'test-appraisal-123';
  const mockReportUrl = 'reports/test-report.pdf';
  const mockGenerateReport = vi.fn();
  const mockOnReportGenerated = vi.fn();
  
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Default mock implementation for the hook
    vi.mocked(reportGenerationHook.useReportGeneration).mockReturnValue({
      isGenerating: false,
      reportUrl: null,
      generateReport: mockGenerateReport,
      error: null,
    });
  });
  
  it('renders the button correctly in default state', () => {
    render(
      <ReportGenerationButton 
        appraisalId={mockAppraisalId} 
      />
    );
    
    const button = screen.getByRole('button', { name: /download report/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
    
    // Check that the text is rendered
    expect(screen.getByText('Download Report')).toBeInTheDocument();
  });
  
  it('shows loading state when generating a report', () => {
    // Mock the hook to return generating state
    vi.mocked(reportGenerationHook.useReportGeneration).mockReturnValue({
      isGenerating: true,
      reportUrl: null,
      generateReport: mockGenerateReport,
      error: null,
    });
    
    render(
      <ReportGenerationButton 
        appraisalId={mockAppraisalId} 
      />
    );
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
    
    // Check that generating text is shown
    expect(screen.getByText('Generating...')).toBeInTheDocument();
  });
  
  it('calls generateReport when clicked', () => {
    render(
      <ReportGenerationButton 
        appraisalId={mockAppraisalId} 
      />
    );
    
    const button = screen.getByRole('button', { name: /download report/i });
    fireEvent.click(button);
    
    expect(mockGenerateReport).toHaveBeenCalledTimes(1);
  });
  
  it('passes correct props to the hook', () => {
    render(
      <ReportGenerationButton 
        appraisalId={mockAppraisalId}
        reportUrl={mockReportUrl}
        onReportGenerated={mockOnReportGenerated}
      />
    );
    
    expect(reportGenerationHook.useReportGeneration).toHaveBeenCalledWith({
      appraisalId: mockAppraisalId,
      initialReportUrl: mockReportUrl,
      onReportGenerated: mockOnReportGenerated,
    });
  });
  
  it('allows customization through props', () => {
    render(
      <ReportGenerationButton 
        appraisalId={mockAppraisalId}
        variant="outline"
        size="sm"
        label="Get PDF"
        className="custom-class"
      />
    );
    
    const button = screen.getByRole('button', { name: /get pdf/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('custom-class');
  });
  
  it('disables the button when report is generating', () => {
    // Mock the hook to return generating state
    vi.mocked(reportGenerationHook.useReportGeneration).mockReturnValue({
      isGenerating: true,
      reportUrl: null,
      generateReport: mockGenerateReport,
      error: null,
    });
    
    render(
      <ReportGenerationButton 
        appraisalId={mockAppraisalId} 
      />
    );
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
}); 