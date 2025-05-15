import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { render, mockAuthContext } from '@/tests/utils/test-utils';
import { AppraisalDetail } from '@/components/appraisals/AppraisalDetail';
import * as AuthContext from '@/contexts/AuthContext';
import * as appraisalService from '@/services/appraisal';
import * as propertyDataService from '@/services/property-data';
import * as propertyValuationService from '@/services/property-valuation';
import * as realtimeHooks from '@/hooks/useRealtimeSubscription';
import { mockAppraisal, mockComparables, mockAppraisalResponse } from '@/tests/mocks/appraisal.mock';

// Mock modules
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useParams: () => ({ id: 'abcd1234-5678-efgh-9012-ijklmnopqrst' }),
  useNavigate: () => vi.fn(),
}));

vi.mock('@/services/appraisal', () => ({
  getAppraisalWithComparables: vi.fn(),
  deleteAppraisal: vi.fn(),
  updateAppraisalWithPropertyData: vi.fn(),
  getAppraisalReport: vi.fn(),
}));

vi.mock('@/services/property-data', () => ({
  updateAppraisalWithPropertyData: vi.fn(),
}));

vi.mock('@/services/property-valuation', () => ({
  requestPropertyValuation: vi.fn(),
  isEligibleForValuation: vi.fn(),
}));

vi.mock('@/hooks/useRealtimeSubscription', () => ({
  useAppraisalRealtimeUpdates: vi.fn(),
  useComparablesRealtimeUpdates: vi.fn(),
}));

describe('AppraisalDetail Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Mock Auth context
    vi.mocked(AuthContext.useAuth).mockReturnValue(mockAuthContext());
    
    // Mock realtime subscription
    vi.mocked(realtimeHooks.useAppraisalRealtimeUpdates).mockReturnValue({
      isConnected: true,
      lastChange: null,
      error: null,
      subscription: null,
    });
    
    vi.mocked(realtimeHooks.useComparablesRealtimeUpdates).mockReturnValue({
      isConnected: true,
      lastChange: null,
      error: null,
      subscription: null,
    });
    
    // Mock successful API response
    vi.mocked(appraisalService.getAppraisalWithComparables).mockResolvedValue(mockAppraisalResponse);
    
    // Mock property valuation eligibility
    vi.mocked(propertyValuationService.isEligibleForValuation).mockResolvedValue({
      success: true,
      error: null,
      data: true,
    });
  });
  
  it('renders the loading state initially', async () => {
    render(<AppraisalDetail />);
    
    // Check loading state
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
  
  it('renders the appraisal details correctly', async () => {
    render(<AppraisalDetail />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
    
    // Check that appraisal details are displayed
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
    expect(screen.getByText('Suburbia')).toBeInTheDocument();
    expect(screen.getByText('Metropolis')).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();
  });
  
  it('renders the error state when appraisal fetch fails', async () => {
    // Mock error response
    vi.mocked(appraisalService.getAppraisalWithComparables).mockResolvedValue({
      success: false,
      error: 'Failed to fetch appraisal details',
      data: null,
    });
    
    render(<AppraisalDetail />);
    
    // Wait for error state
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
    
    // Check error message
    expect(screen.getByText(/failed to fetch appraisal details/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });
  
  it('displays comparable properties correctly', async () => {
    render(<AppraisalDetail />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
    
    // Check for tabs and select comparables tab
    const comparablesTab = screen.getByRole('tab', { name: /comparables/i });
    fireEvent.click(comparablesTab);
    
    // Check that comparable properties are displayed
    expect(screen.getByText('124 Main St')).toBeInTheDocument();
    expect(screen.getByText('130 Main St')).toBeInTheDocument();
    expect(screen.getByText('118 Main St')).toBeInTheDocument();
    
    // Check sale prices are displayed
    expect(screen.getByText('$750,000')).toBeInTheDocument();
    expect(screen.getByText('$820,000')).toBeInTheDocument();
    expect(screen.getByText('$690,000')).toBeInTheDocument();
  });
  
  it('handles the delete appraisal action', async () => {
    // Mock successful delete
    vi.mocked(appraisalService.deleteAppraisal).mockResolvedValue({
      success: true,
      error: null,
      data: null,
    });
    
    render(<AppraisalDetail />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
    
    // Find and click the delete button
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);
    
    // Confirm deletion in dialog
    const confirmDeleteButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmDeleteButton);
    
    // Check that delete function was called
    await waitFor(() => {
      expect(appraisalService.deleteAppraisal).toHaveBeenCalledWith('abcd1234-5678-efgh-9012-ijklmnopqrst');
    });
  });
  
  it('handles property data fetching', async () => {
    // Mock successful property data fetch
    vi.mocked(propertyDataService.updateAppraisalWithPropertyData).mockResolvedValue({
      success: true,
      error: null,
      data: { ...mockAppraisal, property_address: 'Updated Address' },
    });
    
    render(<AppraisalDetail />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
    
    // Find and click the fetch property data button
    const fetchDataButton = screen.getByRole('button', { name: /fetch property data/i });
    fireEvent.click(fetchDataButton);
    
    // Check that fetch function was called
    await waitFor(() => {
      expect(propertyDataService.updateAppraisalWithPropertyData).toHaveBeenCalledWith('abcd1234-5678-efgh-9012-ijklmnopqrst');
    });
  });
  
  it('handles property valuation request', async () => {
    // Mock successful valuation request
    vi.mocked(propertyValuationService.requestPropertyValuation).mockResolvedValue({
      success: true,
      error: null,
      data: { 
        status: 'processing',
        message: 'Valuation request submitted successfully' 
      },
    });
    
    render(<AppraisalDetail />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
    
    // Find and click the request valuation button
    const requestValuationButton = screen.getByRole('button', { name: /request valuation/i });
    fireEvent.click(requestValuationButton);
    
    // Check that valuation function was called
    await waitFor(() => {
      expect(propertyValuationService.requestPropertyValuation).toHaveBeenCalledWith('abcd1234-5678-efgh-9012-ijklmnopqrst');
    });
  });
  
  it('handles report generation', async () => {
    // Mock successful report generation
    vi.mocked(appraisalService.getAppraisalReport).mockResolvedValue({
      success: true,
      error: null,
      data: 'https://example.com/report.pdf',
    });
    
    render(<AppraisalDetail />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
    
    // Find and click the generate report button
    const generateReportButton = screen.getByRole('button', { name: /generate report/i });
    fireEvent.click(generateReportButton);
    
    // Check that report generation function was called
    await waitFor(() => {
      expect(appraisalService.getAppraisalReport).toHaveBeenCalledWith('abcd1234-5678-efgh-9012-ijklmnopqrst');
    });
  });
  
  it('updates the UI when realtime changes occur', async () => {
    render(<AppraisalDetail />);
    
    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
    
    // Simulate a realtime update with new appraisal data
    const updatedAppraisal = {
      ...mockAppraisal,
      status: 'completed',
      valuation_low: 750000,
      valuation_high: 850000,
    };
    
    // Mock the realtime update
    vi.mocked(realtimeHooks.useAppraisalRealtimeUpdates).mockReturnValue({
      isConnected: true,
      lastChange: {
        schema: 'public',
        table: 'appraisals',
        commit_timestamp: '2023-06-01T00:00:00Z',
        eventType: 'UPDATE',
        new: updatedAppraisal,
        old: mockAppraisal,
      },
      error: null,
      subscription: null,
    });
    
    // Re-render with new data
    render(<AppraisalDetail />);
    
    // Check that the UI has updated with the new status
    await waitFor(() => {
      expect(screen.getByText('completed')).toBeInTheDocument();
    });
    
    // Check that valuation range is displayed
    expect(screen.getByText('$750,000 - $850,000')).toBeInTheDocument();
  });
}); 