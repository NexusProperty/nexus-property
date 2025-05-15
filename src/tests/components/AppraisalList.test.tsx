import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { render, mockAuthContext } from '@/tests/utils/test-utils';
import { AppraisalList } from '@/components/appraisals/AppraisalList';
import * as AuthContext from '@/contexts/AuthContext';
import * as appraisalService from '@/services/appraisal';
import * as realtimeHooks from '@/hooks/useRealtimeSubscription';

// Mock modules
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/services/appraisal', () => ({
  getUserAppraisals: vi.fn(),
  searchAppraisals: vi.fn(),
}));

vi.mock('@/hooks/useRealtimeSubscription', () => ({
  useUserAppraisalsRealtimeUpdates: vi.fn(),
}));

// Sample mock appraisals
const mockAppraisals = [
  {
    id: '1',
    user_id: 'test-user-id',
    property_id: 'property-1',
    property_address: '123 Test Street',
    property_suburb: 'Testville',
    property_city: 'Testington',
    status: 'completed',
    valuation_low: 750000,
    valuation_high: 850000,
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-02T00:00:00.000Z',
  },
  {
    id: '2',
    user_id: 'test-user-id',
    property_id: 'property-2',
    property_address: '456 Sample Avenue',
    property_suburb: 'Sampletown',
    property_city: 'Exampleville',
    status: 'pending',
    valuation_low: null,
    valuation_high: null,
    created_at: '2023-01-03T00:00:00.000Z',
    updated_at: '2023-01-03T00:00:00.000Z',
  },
  {
    id: '3',
    user_id: 'test-user-id',
    property_id: 'property-3',
    property_address: '789 Processing Road',
    property_suburb: 'Processville',
    property_city: 'Waitington',
    status: 'processing',
    valuation_low: null,
    valuation_high: null,
    created_at: '2023-01-04T00:00:00.000Z',
    updated_at: '2023-01-04T00:00:00.000Z',
  },
];

describe('AppraisalList Component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Mock Auth context
    vi.mocked(AuthContext.useAuth).mockReturnValue(mockAuthContext());
    
    // Mock realtime subscription
    vi.mocked(realtimeHooks.useUserAppraisalsRealtimeUpdates).mockReturnValue({
      isConnected: true,
      lastChange: null,
    });
    
    // Mock successful API response
    vi.mocked(appraisalService.getUserAppraisals).mockResolvedValue({
      success: true,
      data: mockAppraisals,
      error: null,
    });
    
    vi.mocked(appraisalService.searchAppraisals).mockResolvedValue({
      success: true,
      data: mockAppraisals,
      error: null,
    });
  });
  
  it('renders the appraisal list correctly', async () => {
    render(<AppraisalList />);
    
    // Check loading state first
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    
    // Check that appraisals are displayed
    expect(screen.getByText('123 Test Street')).toBeInTheDocument();
    expect(screen.getByText('456 Sample Avenue')).toBeInTheDocument();
    expect(screen.getByText('789 Processing Road')).toBeInTheDocument();
    
    // Check status badges
    expect(screen.getByText('completed')).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();
    expect(screen.getByText('processing')).toBeInTheDocument();
    
    // Check valuation display
    expect(screen.getByText('$750,000 - $850,000')).toBeInTheDocument();
    expect(screen.getAllByText('Pending').length).toBeGreaterThan(0);
  });
  
  it('handles search functionality', async () => {
    render(<AppraisalList />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    
    // Set up search to return filtered results
    vi.mocked(appraisalService.searchAppraisals).mockResolvedValueOnce({
      success: true,
      data: [mockAppraisals[0]], // Only the first appraisal matches
      error: null,
    });
    
    // Type in search box
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'Test Street' } });
    
    // Press search button
    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);
    
    // Check loading state
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    
    // Wait for search results
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    
    // Verify search service was called correctly
    expect(appraisalService.searchAppraisals).toHaveBeenCalledWith('Test Street', 'test-user-id');
    
    // Check that only the matching appraisal is displayed
    expect(screen.getByText('123 Test Street')).toBeInTheDocument();
    expect(screen.queryByText('456 Sample Avenue')).not.toBeInTheDocument();
  });
  
  it('filters by status', async () => {
    render(<AppraisalList />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    
    // Open status filter dropdown
    const statusFilter = screen.getByText(/all statuses/i);
    fireEvent.click(statusFilter);
    
    // Select 'completed' status
    const completedOption = screen.getByText(/^completed$/i);
    fireEvent.click(completedOption);
    
    // Check that only completed appraisals are shown
    expect(screen.getByText('123 Test Street')).toBeInTheDocument();
    expect(screen.queryByText('456 Sample Avenue')).not.toBeInTheDocument();
    expect(screen.queryByText('789 Processing Road')).not.toBeInTheDocument();
  });
  
  it('sorts appraisals', async () => {
    render(<AppraisalList />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    
    // Open sort dropdown
    const sortDropdown = screen.getByText(/newest first/i);
    fireEvent.click(sortDropdown);
    
    // Select 'address (a-z)' sort option
    const addressAscOption = screen.getByText(/address \(a-z\)/i);
    fireEvent.click(addressAscOption);
    
    // Check the order of appraisals
    const appraisalAddresses = screen.getAllByTestId('appraisal-address');
    expect(appraisalAddresses[0]).toHaveTextContent('123 Test Street');
    expect(appraisalAddresses[1]).toHaveTextContent('456 Sample Avenue');
    expect(appraisalAddresses[2]).toHaveTextContent('789 Processing Road');
  });
  
  it('handles error state', async () => {
    // Mock error response
    vi.mocked(appraisalService.getUserAppraisals).mockResolvedValue({
      success: false,
      data: null,
      error: 'Failed to fetch appraisals',
    });
    
    render(<AppraisalList />);
    
    // Wait for error state
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    
    // Check error message
    expect(screen.getByText(/failed to fetch appraisals/i)).toBeInTheDocument();
  });
  
  it('displays empty state when no appraisals', async () => {
    // Mock empty response
    vi.mocked(appraisalService.getUserAppraisals).mockResolvedValue({
      success: true,
      data: [],
      error: null,
    });
    
    render(<AppraisalList />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    
    // Check empty state message
    expect(screen.getByText(/no appraisals found/i)).toBeInTheDocument();
  });
  
  it('handles realtime updates', async () => {
    render(<AppraisalList />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    
    // Simulate a realtime update - new appraisal added
    const newAppraisal = {
      id: '4',
      user_id: 'test-user-id',
      property_id: 'property-4',
      property_address: '999 New Property',
      property_suburb: 'Newville',
      property_city: 'Freshtown',
      status: 'pending',
      valuation_low: null,
      valuation_high: null,
      created_at: '2023-01-05T00:00:00.000Z',
      updated_at: '2023-01-05T00:00:00.000Z',
    };
    
    const realtimeHook = vi.mocked(realtimeHooks.useUserAppraisalsRealtimeUpdates);
    
    // Update the mock to return a new lastChange
    realtimeHook.mockReturnValue({
      isConnected: true,
      lastChange: {
        eventType: 'INSERT',
        new: newAppraisal,
        old: null,
      },
    });
    
    // Re-render to trigger the effect
    render(<AppraisalList />);
    
    // Check that the new appraisal is added
    await waitFor(() => {
      expect(screen.getByText('999 New Property')).toBeInTheDocument();
    });
  });
}); 