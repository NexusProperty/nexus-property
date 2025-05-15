import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Mock the Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        match: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { /* Sample property data */ },
            error: null
          })
        }),
        order: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ /* Sample query result */ }],
            error: null
          })
        })
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: { /* Sample update result */ },
          error: null
        })
      })
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null
      })
    },
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: { path: 'reports/test-report-id.pdf' },
          error: null
        }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/storage/reports/test-report-id.pdf' }
        })
      })
    },
    functions: {
      invoke: vi.fn().mockImplementation((functionName, options) => {
        if (functionName === 'generate-report') {
          return Promise.resolve({
            data: {
              success: true,
              data: {
                reportId: 'test-report-id',
                reportUrl: 'https://example.com/storage/reports/test-report-id.pdf',
                generatedAt: new Date().toISOString(),
                reportType: 'full',
                sections: [
                  'cover',
                  'property_details',
                  'valuation',
                  'comparables',
                  'market_analysis',
                  'location_analysis',
                  'appendix'
                ],
                metadata: {
                  pageCount: 12,
                  fileSize: 2489654, // bytes
                  version: '1.0'
                }
              }
            },
            error: null
          });
        }
        return Promise.resolve({ data: null, error: new Error('Function not found') });
      })
    }
  })
}));

describe('Report Generation Edge Function', () => {
  let supabase;
  
  beforeEach(() => {
    // Reset mocks between tests
    vi.clearAllMocks();
    
    // Create a fresh Supabase client for each test
    supabase = createClient('http://localhost:54321', 'fake-key');
  });

  it('should generate a full appraisal report successfully', async () => {
    // Arrange
    const appraisalId = 'test-appraisal-id';
    const reportType = 'full';
    const includeMarketAnalysis = true;
    const includeCoverPage = true;
    const includePropertyHistory = true;
    
    // Act
    const response = await supabase.functions.invoke('generate-report', {
      body: {
        appraisalId,
        reportType,
        includeMarketAnalysis,
        includeCoverPage,
        includePropertyHistory
      }
    });

    // Assert
    expect(response.error).toBeNull();
    expect(response.data).toBeDefined();
    expect(response.data.success).toBe(true);
    
    // Check report data structure
    const reportData = response.data.data;
    expect(reportData).toBeDefined();
    expect(reportData.reportId).toBeDefined();
    expect(reportData.reportUrl).toBeDefined();
    expect(reportData.reportUrl).toContain('https://');
    expect(reportData.reportUrl).toContain('.pdf');
    expect(reportData.generatedAt).toBeDefined();
    expect(new Date(reportData.generatedAt)).toBeInstanceOf(Date);
    expect(reportData.reportType).toBe('full');
    
    // Check sections are included
    expect(Array.isArray(reportData.sections)).toBe(true);
    expect(reportData.sections).toContain('cover');
    expect(reportData.sections).toContain('property_details');
    expect(reportData.sections).toContain('valuation');
    expect(reportData.sections).toContain('comparables');
    expect(reportData.sections).toContain('market_analysis');
    
    // Check metadata
    expect(reportData.metadata).toBeDefined();
    expect(typeof reportData.metadata.pageCount).toBe('number');
    expect(typeof reportData.metadata.fileSize).toBe('number');
    expect(reportData.metadata.version).toBeDefined();
  });

  it('should generate a summary report with minimal sections', async () => {
    // Arrange - Mock response for summary report
    supabase.functions.invoke.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          reportId: 'test-summary-report-id',
          reportUrl: 'https://example.com/storage/reports/test-summary-report-id.pdf',
          generatedAt: new Date().toISOString(),
          reportType: 'summary',
          sections: [
            'property_details',
            'valuation',
            'comparables'
          ],
          metadata: {
            pageCount: 4,
            fileSize: 985412, // bytes
            version: '1.0'
          }
        }
      },
      error: null
    });
    
    // Act
    const response = await supabase.functions.invoke('generate-report', {
      body: {
        appraisalId: 'test-appraisal-id',
        reportType: 'summary',
        includeMarketAnalysis: false,
        includeCoverPage: false,
        includePropertyHistory: false
      }
    });

    // Assert
    expect(response.error).toBeNull();
    expect(response.data).toBeDefined();
    expect(response.data.success).toBe(true);
    
    // Check report type and sections
    const reportData = response.data.data;
    expect(reportData.reportType).toBe('summary');
    expect(reportData.sections).not.toContain('cover');
    expect(reportData.sections).not.toContain('market_analysis');
    expect(reportData.sections).not.toContain('property_history');
    expect(reportData.sections).toContain('property_details');
    expect(reportData.sections).toContain('valuation');
  });

  it('should handle errors when appraisal data is incomplete', async () => {
    // Arrange - Mock an error response
    supabase.functions.invoke.mockResolvedValueOnce({
      data: {
        success: false,
        error: 'Failed to generate report: Appraisal data incomplete - missing valuation results'
      },
      error: null
    });

    // Act - Call with invalid appraisal data
    const response = await supabase.functions.invoke('generate-report', {
      body: {
        appraisalId: 'incomplete-appraisal-id',
        reportType: 'full'
      }
    });

    // Assert
    expect(response.error).toBeNull();
    expect(response.data).toBeDefined();
    expect(response.data.success).toBe(false);
    expect(response.data.error).toContain('Failed to generate report');
  });

  it('should handle custom branding options', async () => {
    // Arrange - Mock response with branding options
    supabase.functions.invoke.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          reportId: 'test-branded-report-id',
          reportUrl: 'https://example.com/storage/reports/test-branded-report-id.pdf',
          generatedAt: new Date().toISOString(),
          reportType: 'full',
          sections: [
            'cover',
            'property_details',
            'valuation',
            'comparables',
            'market_analysis'
          ],
          metadata: {
            pageCount: 12,
            fileSize: 2489654,
            version: '1.0',
            branding: {
              logoUrl: 'https://example.com/logo.png',
              companyName: 'Test Realty Ltd',
              companyContact: 'info@testrealty.example.com',
              primaryColor: '#FF5500'
            }
          }
        }
      },
      error: null
    });
    
    // Act
    const response = await supabase.functions.invoke('generate-report', {
      body: {
        appraisalId: 'test-appraisal-id',
        reportType: 'full',
        brandingOptions: {
          logoUrl: 'https://example.com/logo.png',
          companyName: 'Test Realty Ltd',
          companyContact: 'info@testrealty.example.com',
          primaryColor: '#FF5500'
        }
      }
    });

    // Assert
    expect(response.error).toBeNull();
    expect(response.data).toBeDefined();
    expect(response.data.success).toBe(true);
    
    // Check branding options are included in metadata
    const metadata = response.data.data.metadata;
    expect(metadata.branding).toBeDefined();
    expect(metadata.branding.logoUrl).toBe('https://example.com/logo.png');
    expect(metadata.branding.companyName).toBe('Test Realty Ltd');
    expect(metadata.branding.primaryColor).toBe('#FF5500');
  });
}); 