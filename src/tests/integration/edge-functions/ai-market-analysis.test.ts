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

describe('ai-market-analysis Edge Function', () => {
  let supabase: ReturnType<typeof createClient<Database>>;

  beforeEach(() => {
    vi.clearAllMocks();
    supabase = createClient<Database>('https://test.supabase.co', 'test-key');
  });

  it('should generate market analysis with default parameters', async () => {
    // Arrange
    const analysisRequest = {
      suburb: 'Testville',
      city: 'Auckland',
      propertyType: 'House'
    };

    const mockResponse = {
      marketAnalysis: {
        summary: 'Testville is a growing suburb in Auckland with strong demand for houses.',
        medianPrice: 850000,
        priceGrowth: 5.2,
        daysOnMarket: 28,
        supplyDemandRatio: 0.8,
        futureTrend: 'Steady growth expected over the next 12 months.',
        keyDrivers: [
          'Close proximity to Auckland CBD',
          'Good school zones',
          'Recent infrastructure improvements'
        ]
      }
    };

    vi.spyOn(supabase.functions, 'invoke').mockResolvedValueOnce({ 
      data: mockResponse,
      error: null
    });

    // Act
    const result = await supabase.functions.invoke('ai-market-analysis', {
      body: analysisRequest
    });

    // Assert
    expect(supabase.functions.invoke).toHaveBeenCalledWith('ai-market-analysis', {
      body: analysisRequest
    });
    expect(result.data).toEqual(mockResponse);
    expect(result.error).toBeNull();
  });

  it('should generate market analysis with custom time period', async () => {
    // Arrange
    const analysisRequest = {
      suburb: 'Testville',
      city: 'Auckland',
      propertyType: 'House',
      timeframe: {
        months: 24,
        compareWithPrevious: true
      }
    };

    const mockResponse = {
      marketAnalysis: {
        summary: 'Testville has shown consistent growth over the past 24 months.',
        medianPrice: 850000,
        priceGrowth: 8.5,
        priceGrowthPrevPeriod: 6.2,
        daysOnMarket: 28,
        daysOnMarketPrevPeriod: 35,
        supplyDemandRatio: 0.8,
        futureTrend: 'Continued steady growth expected over the next 12-24 months.'
      }
    };

    vi.spyOn(supabase.functions, 'invoke').mockResolvedValueOnce({ 
      data: mockResponse,
      error: null
    });

    // Act
    const result = await supabase.functions.invoke('ai-market-analysis', {
      body: analysisRequest
    });

    // Assert
    expect(supabase.functions.invoke).toHaveBeenCalledWith('ai-market-analysis', {
      body: analysisRequest
    });
    expect(result.data).toEqual(mockResponse);
    expect(result.error).toBeNull();
    expect(result.data?.marketAnalysis.priceGrowthPrevPeriod).toBeDefined();
    expect(result.data?.marketAnalysis.daysOnMarketPrevPeriod).toBeDefined();
  });

  it('should generate market analysis with specific focus areas', async () => {
    // Arrange
    const analysisRequest = {
      suburb: 'Testville',
      city: 'Auckland',
      propertyType: 'House',
      focusAreas: ['investment', 'rental', 'development']
    };

    const mockResponse = {
      marketAnalysis: {
        summary: 'Testville presents strong investment opportunities.',
        investmentAnalysis: {
          yieldEstimate: 4.2,
          capitalGrowthPotential: 'Medium to High',
          recommendedStrategy: 'Buy and hold for 5+ years'
        },
        rentalAnalysis: {
          medianWeeklyRent: 650,
          rentalDemand: 'High',
          vacancyRate: 1.8
        },
        developmentAnalysis: {
          zoning: 'Mixed Housing Urban',
          developmentPotential: 'Good',
          keyConstraints: ['Height restrictions', 'Infrastructure capacity']
        }
      }
    };

    vi.spyOn(supabase.functions, 'invoke').mockResolvedValueOnce({ 
      data: mockResponse,
      error: null
    });

    // Act
    const result = await supabase.functions.invoke('ai-market-analysis', {
      body: analysisRequest
    });

    // Assert
    expect(supabase.functions.invoke).toHaveBeenCalledWith('ai-market-analysis', {
      body: analysisRequest
    });
    expect(result.data).toEqual(mockResponse);
    expect(result.error).toBeNull();
    expect(result.data?.marketAnalysis.investmentAnalysis).toBeDefined();
    expect(result.data?.marketAnalysis.rentalAnalysis).toBeDefined();
    expect(result.data?.marketAnalysis.developmentAnalysis).toBeDefined();
  });

  it('should return error with insufficient location data', async () => {
    // Arrange
    const analysisRequest = {
      // Missing suburb
      city: 'Auckland',
      propertyType: 'House'
    };
    
    vi.spyOn(supabase.functions, 'invoke').mockResolvedValueOnce({ 
      data: null,
      error: { 
        message: 'Insufficient location data for market analysis', 
        status: 400,
        details: 'suburb is required'
      }
    });

    // Act
    const result = await supabase.functions.invoke('ai-market-analysis', {
      body: analysisRequest
    });

    // Assert
    expect(supabase.functions.invoke).toHaveBeenCalledWith('ai-market-analysis', {
      body: analysisRequest
    });
    expect(result.data).toBeNull();
    expect(result.error).toBeDefined();
    expect(result.error?.message).toContain('Insufficient location data');
  });

  it('should handle server errors gracefully', async () => {
    // Arrange
    const analysisRequest = {
      suburb: 'Testville',
      city: 'Auckland',
      propertyType: 'House'
    };
    
    vi.spyOn(supabase.functions, 'invoke').mockResolvedValueOnce({ 
      data: null,
      error: { message: 'Internal server error', status: 500 }
    });

    // Act
    const result = await supabase.functions.invoke('ai-market-analysis', {
      body: analysisRequest
    });

    // Assert
    expect(result.data).toBeNull();
    expect(result.error).toBeDefined();
    expect(result.error?.message).toBe('Internal server error');
  });
}); 