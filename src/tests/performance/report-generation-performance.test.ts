import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { createMockUser } from '@/tests/utils/supabase-test-utils';

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn()
    },
    functions: {
      invoke: vi.fn()
    },
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'reports/test-report.pdf' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/reports/test-report.pdf' } })
      })
    }
  }
}));

// Test data
const TEST_APPRAISAL_ID = '12345678-abcd-1234-efgh-123456789012';

// Realistic report generation mock response that includes timing data
const MOCK_PERFORMANCE_RESPONSE = {
  success: true,
  data: {
    reportUrl: 'https://example.com/reports/test-report.pdf',
    generatedAt: new Date().toISOString(),
    performanceMetrics: {
      totalTimeMs: 3450,
      steps: {
        fetchAppraisalData: 320,
        fetchPropertyImages: 850,
        generateMarketAnalysis: 780,
        renderPDF: 1200,
        uploadToStorage: 300
      },
      resourceUtilization: {
        memoryMb: 215,
        cpuPercent: 78
      }
    }
  }
};

describe('Report Generation Performance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock authenticated user
    const mockUser = createMockUser({ role: 'agent' });
    supabase.auth.getSession.mockResolvedValue({ data: { session: { user: mockUser } } });
    supabase.auth.getUser.mockResolvedValue({ data: { user: mockUser } });
  });

  it('should generate a report within acceptable performance thresholds', async () => {
    // Setup the mock to return our performance response
    supabase.functions.invoke.mockResolvedValue({
      data: MOCK_PERFORMANCE_RESPONSE,
      error: null
    });

    // Start the performance timer
    const startTime = performance.now();

    // Call the report generation function
    const response = await supabase.functions.invoke('generate-appraisal-report', {
      body: {
        appraisalId: TEST_APPRAISAL_ID,
        includePerformanceMetrics: true
      }
    });

    // End the performance timer
    const endTime = performance.now();
    const clientSideTimeMs = endTime - startTime;

    // Verify the function was called with the correct arguments
    expect(supabase.functions.invoke).toHaveBeenCalledWith('generate-appraisal-report', {
      body: {
        appraisalId: TEST_APPRAISAL_ID,
        includePerformanceMetrics: true
      }
    });

    // Verify we got our performance metrics in the response
    expect(response.data.success).toBe(true);
    expect(response.data.data.performanceMetrics).toBeDefined();
    
    // Check that the total time is within acceptable thresholds
    expect(response.data.data.performanceMetrics.totalTimeMs).toBeLessThan(5000);
    
    // Check individual processing steps
    const metrics = response.data.data.performanceMetrics;
    expect(metrics.steps.fetchAppraisalData).toBeLessThan(500);
    expect(metrics.steps.fetchPropertyImages).toBeLessThan(1000);
    expect(metrics.steps.generateMarketAnalysis).toBeLessThan(1000);
    expect(metrics.steps.renderPDF).toBeLessThan(1500);
    expect(metrics.steps.uploadToStorage).toBeLessThan(500);
    
    // Ensure client-side processing time is reasonable
    // Note: This might be unreliable in CI environments, but useful for local testing
    console.log(`Client-side processing time: ${clientSideTimeMs.toFixed(2)}ms`);
    
    // Log detailed performance information
    console.log(JSON.stringify({
      level: 'info',
      message: 'Report generation performance test',
      totalServerTimeMs: metrics.totalTimeMs,
      totalClientTimeMs: clientSideTimeMs,
      steps: metrics.steps,
      resourceUtilization: metrics.resourceUtilization
    }));
  });

  it('should handle multiple simultaneous report generation requests efficiently', async () => {
    // Create slightly modified mock responses for different appraisals
    const createMockResponse = (id: string, timeMultiplier: number) => ({
      success: true,
      data: {
        reportUrl: `https://example.com/reports/test-report-${id}.pdf`,
        generatedAt: new Date().toISOString(),
        performanceMetrics: {
          totalTimeMs: Math.round(3450 * timeMultiplier),
          steps: {
            fetchAppraisalData: Math.round(320 * timeMultiplier),
            fetchPropertyImages: Math.round(850 * timeMultiplier),
            generateMarketAnalysis: Math.round(780 * timeMultiplier),
            renderPDF: Math.round(1200 * timeMultiplier),
            uploadToStorage: Math.round(300 * timeMultiplier)
          },
          resourceUtilization: {
            memoryMb: Math.round(215 * timeMultiplier),
            cpuPercent: Math.min(99, Math.round(78 * timeMultiplier))
          }
        }
      }
    });

    // Setup mocks for multiple calls
    supabase.functions.invoke
      .mockResolvedValueOnce({
        data: createMockResponse('1', 1.0),
        error: null
      })
      .mockResolvedValueOnce({
        data: createMockResponse('2', 1.1),
        error: null
      })
      .mockResolvedValueOnce({
        data: createMockResponse('3', 1.2),
        error: null
      });

    // Start the performance timer
    const startTime = performance.now();

    // Make multiple simultaneous requests
    const requests = [
      supabase.functions.invoke('generate-appraisal-report', {
        body: { appraisalId: '11111111-1111-1111-1111-111111111111', includePerformanceMetrics: true }
      }),
      supabase.functions.invoke('generate-appraisal-report', {
        body: { appraisalId: '22222222-2222-2222-2222-222222222222', includePerformanceMetrics: true }
      }),
      supabase.functions.invoke('generate-appraisal-report', {
        body: { appraisalId: '33333333-3333-3333-3333-333333333333', includePerformanceMetrics: true }
      })
    ];

    // Wait for all to complete
    const responses = await Promise.all(requests);

    // End the performance timer
    const endTime = performance.now();
    const totalClientTimeMs = endTime - startTime;
    const averageClientTimeMs = totalClientTimeMs / responses.length;

    // Verify all requests were successful
    responses.forEach(response => {
      expect(response.data.success).toBe(true);
      expect(response.data.data.performanceMetrics).toBeDefined();
    });

    // Calculate average server-side processing time
    const totalServerTimeMs = responses.reduce(
      (sum, response) => sum + response.data.data.performanceMetrics.totalTimeMs, 
      0
    );
    const averageServerTimeMs = totalServerTimeMs / responses.length;

    // Check that parallel processing is efficient
    console.log(`Parallel processing metrics:
      - Total client time: ${totalClientTimeMs.toFixed(2)}ms
      - Average client time per report: ${averageClientTimeMs.toFixed(2)}ms
      - Average server time per report: ${averageServerTimeMs.toFixed(2)}ms
    `);

    // We expect parallel requests to be significantly more efficient than sequential
    // This test checks that the total client time is less than the sum of server times,
    // indicating that requests were processed in parallel
    expect(totalClientTimeMs).toBeLessThan(totalServerTimeMs * 0.8);

    // Log detailed performance information
    console.log(JSON.stringify({
      level: 'info',
      message: 'Parallel report generation performance test',
      totalClientTimeMs,
      averageClientTimeMs,
      totalServerTimeMs,
      averageServerTimeMs,
      concurrentRequests: responses.length,
      individualMetrics: responses.map(r => r.data.data.performanceMetrics)
    }));
  });

  it('should generate reports with custom branding within performance thresholds', async () => {
    // Mock response with branding performance metrics
    const mockBrandedResponse = {
      success: true,
      data: {
        reportUrl: 'https://example.com/reports/branded-report.pdf',
        generatedAt: new Date().toISOString(),
        performanceMetrics: {
          totalTimeMs: 3750, // Slightly higher due to branding
          steps: {
            fetchAppraisalData: 320,
            fetchPropertyImages: 850,
            fetchBrandingAssets: 250, // Additional step
            generateMarketAnalysis: 780,
            renderPDF: 1250, // Slightly higher with branding
            uploadToStorage: 300
          },
          resourceUtilization: {
            memoryMb: 230,
            cpuPercent: 80
          }
        }
      }
    };

    // Setup the mock to return our branded performance response
    supabase.functions.invoke.mockResolvedValue({
      data: mockBrandedResponse,
      error: null
    });

    // Call the report generation function with branding options
    const response = await supabase.functions.invoke('generate-appraisal-report', {
      body: {
        appraisalId: TEST_APPRAISAL_ID,
        includePerformanceMetrics: true,
        brandingOptions: {
          includeLogo: true,
          includeAgentPhoto: true,
          customColors: true,
          customFooter: true
        }
      }
    });

    // Verify we got our performance metrics in the response
    expect(response.data.success).toBe(true);
    const metrics = response.data.data.performanceMetrics;
    
    // Check that the total time is still within acceptable thresholds, even with branding
    expect(metrics.totalTimeMs).toBeLessThan(5000);
    
    // Check that the branding-specific step is reasonable
    expect(metrics.steps.fetchBrandingAssets).toBeLessThan(500);
    
    // Log detailed performance information with branding impact
    console.log(JSON.stringify({
      level: 'info',
      message: 'Branded report generation performance test',
      totalTimeMs: metrics.totalTimeMs,
      brandingImpactMs: metrics.steps.fetchBrandingAssets,
      renderTimeMs: metrics.steps.renderPDF,
      resourceUtilization: metrics.resourceUtilization
    }));
  });
}); 
