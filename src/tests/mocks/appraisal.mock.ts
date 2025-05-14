import { vi } from 'vitest';

// Sample mock data for appraisal
export const mockAppraisal = {
  id: 'abcd1234-5678-efgh-9012-ijklmnopqrst',
  property_address: '123 Main St',
  property_suburb: 'Suburbia',
  property_city: 'Metropolis',
  property_type: 'house',
  bedrooms: 3,
  bathrooms: 2,
  land_size: 500,
  floor_area: 220,
  year_built: 2010,
  status: 'pending'
};

// Sample mock data for comparable properties
export const mockComparables = [
  {
    id: '1234-5678-90ab-cdef',
    address: '124 Main St',
    suburb: 'Suburbia',
    city: 'Metropolis',
    property_type: 'house',
    bedrooms: 3,
    bathrooms: 2,
    land_size: 520,
    floor_area: 210,
    year_built: 2008,
    sale_date: '2023-01-15',
    sale_price: 750000,
    similarity_score: 89,
    metadata: { distance_km: 0.2 }
  },
  {
    id: '2345-6789-abcd-efgh',
    address: '130 Main St',
    suburb: 'Suburbia',
    city: 'Metropolis',
    property_type: 'house',
    bedrooms: 4,
    bathrooms: 2,
    land_size: 550,
    floor_area: 240,
    year_built: 2012,
    sale_date: '2023-02-20',
    sale_price: 820000,
    similarity_score: 82,
    metadata: { distance_km: 0.3 }
  },
  {
    id: '3456-7890-bcde-fghi',
    address: '118 Main St',
    suburb: 'Suburbia',
    city: 'Metropolis',
    property_type: 'house',
    bedrooms: 3,
    bathrooms: 1,
    land_size: 480,
    floor_area: 200,
    year_built: 2005,
    sale_date: '2022-11-10',
    sale_price: 690000,
    similarity_score: 78,
    metadata: { distance_km: 0.25 }
  }
];

// Mocked response from getAppraisalWithComparables
export const mockAppraisalResponse = {
  success: true,
  error: null,
  data: {
    appraisal: mockAppraisal,
    comparables: mockComparables
  }
};

// Create mock function for getAppraisalWithComparables
export const mockGetAppraisalWithComparables = vi.fn();

// Default successful response
mockGetAppraisalWithComparables.mockImplementation(() => Promise.resolve(mockAppraisalResponse));

// Helper functions to create different scenarios
export const createMockAppraisalWithEmptyAddress = () => ({
  success: true,
  error: null,
  data: {
    appraisal: { ...mockAppraisal, property_address: '' },
    comparables: mockComparables
  }
});

export const createMockAppraisalWithInsufficientComparables = () => ({
  success: true,
  error: null,
  data: {
    appraisal: mockAppraisal,
    comparables: [mockComparables[0]]
  }
});

export const createMockAppraisalWithInvalidComparable = () => {
  const invalidComparable = { 
    ...mockComparables[0], 
    id: 'not-a-uuid'
  };
  
  return {
    success: true,
    error: null,
    data: {
      appraisal: mockAppraisal,
      comparables: [invalidComparable, mockComparables[1], mockComparables[2]]
    }
  };
};

export const createMockAppraisalError = () => ({
  success: false,
  error: 'Failed to fetch appraisal',
  data: null
});

// Mock the appraisal service module
vi.mock('@/services/appraisal', () => {
  return {
    getAppraisalWithComparables: mockGetAppraisalWithComparables
  };
}); 