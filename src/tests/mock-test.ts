import { describe, it, expect, vi } from 'vitest';
import { PropertyValuationData } from '@/data/property-valuation-data';

// @ts-expect-error - Mock instance is added by our setup.ts
const mockInstance = (PropertyValuationData as { mockInstance: unknown }).mockInstance;

describe('Mock Test', () => {
  it('should have proper mock instance setup', () => {
    expect(mockInstance).toBeDefined();
    
    if (mockInstance) {
      expect(mockInstance.updateAppraisalStatus).toBeDefined();
      expect(mockInstance.updateValuationResults).toBeDefined();
      expect(mockInstance.getValuationEligibility).toBeDefined();
      
      // Test mock functionality
      mockInstance.updateAppraisalStatus.mockClear();
      mockInstance.updateAppraisalStatus('test-id', 'test-status', { reason: 'test' });
      
      expect(mockInstance.updateAppraisalStatus).toHaveBeenCalledTimes(1);
    }
  });
}); 