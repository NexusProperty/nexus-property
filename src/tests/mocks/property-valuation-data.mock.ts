import { vi } from 'vitest';

// Create a mock for the PropertyValuationData class
export const mockPropertyValuationData = {
  updateValuationResults: vi.fn().mockResolvedValue({ success: true }),
  updateAppraisalStatus: vi.fn().mockResolvedValue({ success: true }),
  getValuationEligibility: vi.fn().mockResolvedValue({
    eligible: true,
    reasons: []
  })
};

// Mock for the module
vi.mock('@/data/property-valuation-data', () => {
  return {
    PropertyValuationData: vi.fn().mockImplementation(() => {
      return mockPropertyValuationData;
    })
  };
}); 