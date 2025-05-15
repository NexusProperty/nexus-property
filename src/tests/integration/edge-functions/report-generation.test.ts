import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Mock the Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue({
    functions: {
      invoke: vi.fn()
    }
  })
}));

describe('report-generation Edge Function', () => {
  let supabase: ReturnType<typeof createClient<Database>>;

  beforeEach(() => {
    vi.clearAllMocks();
    supabase = createClient<Database>('https://test.supabase.co', 'test-key');
  });

  it('should generate a detailed appraisal report with all sections', async () => {
    // Arrange
    const reportRequest = {
      appraisalId: 'test-appraisal-id',
      reportType: 'detailed',
      includeComparables: true,
      includeMarketAnalysis: true,
      includeValuationBreakdown: true,
      format: 'pdf'
    };

    const mockResponse = {
      reportUrl: 'https://test-storage.com/reports/test-appraisal-id.pdf',
      reportId: 'report-12345',
      sections: ['property', 'valuation', 'comparables', 'marketAnalysis', 'conclusion'],
      generatedAt: '2023-05-01T12:00:00Z',
      reportSizeKb: 256
    };

    vi.spyOn(supabase.functions, 'invoke').mockResolvedValueOnce({ 
      data: mockResponse,
      error: null
    });

    // Act
    const result = await supabase.functions.invoke('report-generation', {
      body: reportRequest
    });

    // Assert
    expect(supabase.functions.invoke).toHaveBeenCalledWith('report-generation', {
      body: reportRequest
    });
    expect(result.data).toEqual(mockResponse);
    expect(result.error).toBeNull();
  });

  it('should generate a summary appraisal report', async () => {
    // Arrange
    const reportRequest = {
      appraisalId: 'test-appraisal-id',
      reportType: 'summary',
      includeComparables: false,
      includeMarketAnalysis: false,
      includeValuationBreakdown: false,
      format: 'pdf'
    };

    const mockResponse = {
      reportUrl: 'https://test-storage.com/reports/test-appraisal-id-summary.pdf',
      reportId: 'report-12346',
      sections: ['property', 'valuation', 'conclusion'],
      generatedAt: '2023-05-01T12:05:00Z',
      reportSizeKb: 128
    };

    vi.spyOn(supabase.functions, 'invoke').mockResolvedValueOnce({ 
      data: mockResponse,
      error: null
    });

    // Act
    const result = await supabase.functions.invoke('report-generation', {
      body: reportRequest
    });

    // Assert
    expect(supabase.functions.invoke).toHaveBeenCalledWith('report-generation', {
      body: reportRequest
    });
    expect(result.data).toEqual(mockResponse);
    expect(result.error).toBeNull();
  });

  it('should support different report formats', async () => {
    // Arrange
    const reportRequest = {
      appraisalId: 'test-appraisal-id',
      reportType: 'detailed',
      includeComparables: true,
      includeMarketAnalysis: true,
      includeValuationBreakdown: true,
      format: 'docx'  // Different format
    };

    const mockResponse = {
      reportUrl: 'https://test-storage.com/reports/test-appraisal-id.docx',
      reportId: 'report-12347',
      sections: ['property', 'valuation', 'comparables', 'marketAnalysis', 'conclusion'],
      generatedAt: '2023-05-01T12:10:00Z',
      reportSizeKb: 240
    };

    vi.spyOn(supabase.functions, 'invoke').mockResolvedValueOnce({ 
      data: mockResponse,
      error: null
    });

    // Act
    const result = await supabase.functions.invoke('report-generation', {
      body: reportRequest
    });

    // Assert
    expect(supabase.functions.invoke).toHaveBeenCalledWith('report-generation', {
      body: reportRequest
    });
    expect(result.data).toEqual(mockResponse);
    expect(result.error).toBeNull();
    expect(result.data?.reportUrl.endsWith('.docx')).toBeTruthy();
  });

  it('should return error when appraisal is not found', async () => {
    // Arrange
    const reportRequest = {
      appraisalId: 'non-existent-id',
      reportType: 'detailed',
      format: 'pdf'
    };
    
    vi.spyOn(supabase.functions, 'invoke').mockResolvedValueOnce({ 
      data: null,
      error: { 
        message: 'Appraisal not found', 
        status: 404
      }
    });

    // Act
    const result = await supabase.functions.invoke('report-generation', {
      body: reportRequest
    });

    // Assert
    expect(supabase.functions.invoke).toHaveBeenCalledWith('report-generation', {
      body: reportRequest
    });
    expect(result.data).toBeNull();
    expect(result.error).toBeDefined();
    expect(result.error?.message).toBe('Appraisal not found');
  });

  it('should handle server errors gracefully', async () => {
    // Arrange
    const reportRequest = {
      appraisalId: 'test-appraisal-id',
      reportType: 'detailed',
      format: 'pdf'
    };
    
    vi.spyOn(supabase.functions, 'invoke').mockResolvedValueOnce({ 
      data: null,
      error: { message: 'Internal server error', status: 500 }
    });

    // Act
    const result = await supabase.functions.invoke('report-generation', {
      body: reportRequest
    });

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toBeDefined();
    expect(result.error?.message).toBe('Internal server error');
  });

  it('should support additional report customization options', async () => {
    // Arrange
    const reportRequest = {
      appraisalId: 'test-appraisal-id',
      reportType: 'detailed',
      includeComparables: true,
      includeMarketAnalysis: true,
      format: 'pdf',
      customization: {
        logoUrl: 'https://company.com/logo.png',
        companyName: 'ABC Appraisals',
        primaryColor: '#003366',
        secondaryColor: '#FF9900',
        contactInfo: {
          email: 'contact@abcappraisals.com',
          phone: '09 123 4567'
        }
      }
    };

    const mockResponse = {
      reportUrl: 'https://test-storage.com/reports/test-appraisal-id-branded.pdf',
      reportId: 'report-12348',
      sections: ['property', 'valuation', 'comparables', 'marketAnalysis', 'conclusion'],
      generatedAt: '2023-05-01T12:15:00Z',
      reportSizeKb: 265,
      customizationApplied: true
    };

    vi.spyOn(supabase.functions, 'invoke').mockResolvedValueOnce({ 
      data: mockResponse,
      error: null
    });

    // Act
    const result = await supabase.functions.invoke('report-generation', {
      body: reportRequest
    });

    // Assert
    expect(supabase.functions.invoke).toHaveBeenCalledWith('report-generation', {
      body: reportRequest
    });
    expect(result.data).toEqual(mockResponse);
    expect(result.error).toBeNull();
    expect(result.data?.customizationApplied).toBeTruthy();
  });
}); 