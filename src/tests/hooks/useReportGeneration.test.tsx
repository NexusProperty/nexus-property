import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReportGeneration } from '@/hooks/useReportGeneration';
import * as reportService from '@/services/reportGeneration';

// Mock report generation services
vi.mock('@/services/reportGeneration', () => ({
  generateAppraisalReport: vi.fn(),
  getReportDownloadUrl: vi.fn(),
  trackReportDownload: vi.fn(),
}));

// Mock useToast
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock window.open
const mockWindowOpen = vi.fn();
window.open = mockWindowOpen;

describe('useReportGeneration Hook', () => {
  // Define test data
  const mockAppraisalId = 'test-appraisal-123';
  const mockReportUrl = 'reports/test-report.pdf';
  const mockDownloadUrl = 'https://example.com/signed-url-to-report.pdf';
  const mockOnReportGenerated = vi.fn();
  
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Default successful response for generateAppraisalReport
    vi.mocked(reportService.generateAppraisalReport).mockResolvedValue({
      success: true,
      error: null,
      data: {
        reportUrl: mockReportUrl,
        downloadUrl: mockDownloadUrl,
      },
    });
    
    // Default successful response for getReportDownloadUrl
    vi.mocked(reportService.getReportDownloadUrl).mockResolvedValue({
      success: true,
      error: null,
      data: {
        reportUrl: mockReportUrl,
        downloadUrl: mockDownloadUrl,
      },
    });
  });
  
  it('initializes with correct default values', () => {
    const { result } = renderHook(() => useReportGeneration({ appraisalId: mockAppraisalId }));
    
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.reportUrl).toBeNull();
    expect(result.current.error).toBeNull();
    expect(typeof result.current.generateReport).toBe('function');
  });
  
  it('initializes with provided reportUrl', () => {
    const { result } = renderHook(() => 
      useReportGeneration({ 
        appraisalId: mockAppraisalId, 
        initialReportUrl: mockReportUrl 
      })
    );
    
    expect(result.current.reportUrl).toBe(mockReportUrl);
  });
  
  it('generates a new report when none exists', async () => {
    const { result } = renderHook(() => 
      useReportGeneration({ 
        appraisalId: mockAppraisalId,
        onReportGenerated: mockOnReportGenerated
      })
    );
    
    // Execute the generateReport function
    await act(async () => {
      await result.current.generateReport();
    });
    
    // Check that the service was called
    expect(reportService.generateAppraisalReport).toHaveBeenCalledWith(mockAppraisalId);
    
    // Check internal state was updated
    expect(result.current.reportUrl).toBe(mockReportUrl);
    expect(result.current.isGenerating).toBe(false);
    
    // Check callback was called
    expect(mockOnReportGenerated).toHaveBeenCalledWith(mockReportUrl);
    
    // Check browser download was initiated
    expect(mockWindowOpen).toHaveBeenCalledWith(mockDownloadUrl, '_blank');
  });
  
  it('gets a download URL for an existing report', async () => {
    const { result } = renderHook(() => 
      useReportGeneration({ 
        appraisalId: mockAppraisalId,
        initialReportUrl: mockReportUrl
      })
    );
    
    // Execute the generateReport function
    await act(async () => {
      await result.current.generateReport();
    });
    
    // Check services were called correctly
    expect(reportService.getReportDownloadUrl).toHaveBeenCalledWith(mockReportUrl);
    expect(reportService.trackReportDownload).toHaveBeenCalledWith(mockAppraisalId);
    expect(reportService.generateAppraisalReport).not.toHaveBeenCalled();
    
    // Check browser download was initiated
    expect(mockWindowOpen).toHaveBeenCalledWith(mockDownloadUrl, '_blank');
  });
  
  it('handles errors during report generation', async () => {
    // Mock error response
    vi.mocked(reportService.generateAppraisalReport).mockResolvedValue({
      success: false,
      error: 'Failed to generate report',
      data: null,
    });
    
    const { result } = renderHook(() => 
      useReportGeneration({ 
        appraisalId: mockAppraisalId 
      })
    );
    
    // Execute the generateReport function
    await act(async () => {
      await result.current.generateReport();
    });
    
    // Check error state
    expect(result.current.error).toBe('Failed to generate report');
    expect(result.current.isGenerating).toBe(false);
    
    // Check browser download was not initiated
    expect(mockWindowOpen).not.toHaveBeenCalled();
  });
  
  it('handles errors getting download URL', async () => {
    // Mock error response
    vi.mocked(reportService.getReportDownloadUrl).mockResolvedValue({
      success: false,
      error: 'Failed to get download URL',
      data: null,
    });
    
    const { result } = renderHook(() => 
      useReportGeneration({ 
        appraisalId: mockAppraisalId,
        initialReportUrl: mockReportUrl
      })
    );
    
    // Execute the generateReport function
    await act(async () => {
      await result.current.generateReport();
    });
    
    // Check error state
    expect(result.current.error).toBe('Failed to get download URL');
    expect(result.current.isGenerating).toBe(false);
    
    // Check browser download was not initiated
    expect(mockWindowOpen).not.toHaveBeenCalled();
  });
  
  it('prevents multiple simultaneous report generations', async () => {
    const { result } = renderHook(() => 
      useReportGeneration({ 
        appraisalId: mockAppraisalId 
      })
    );
    
    // Start a report generation
    const generatePromise = act(async () => {
      // Set isGenerating to true but don't await the promise yet
      result.current.generateReport();
      
      // Try to call it again while still generating
      await result.current.generateReport();
    });
    
    // Wait for the promise to resolve
    await generatePromise;
    
    // The service should only be called once
    expect(reportService.generateAppraisalReport).toHaveBeenCalledTimes(1);
  });
}); 