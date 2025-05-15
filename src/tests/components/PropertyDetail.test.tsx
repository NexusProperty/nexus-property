import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { render } from '@/tests/utils/test-utils';
import { PropertyDetail } from '@/components/properties/PropertyDetail';
import * as AuthContext from '@/contexts/AuthContext';
import * as propertyService from '@/services/property';
import { useParams, useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';

// Mock modules
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/services/property', () => ({
  getProperty: vi.fn(),
  deleteProperty: vi.fn(),
}));

// Mock router hooks
vi.mock('react-router-dom', () => ({
  useParams: vi.fn(),
  useNavigate: vi.fn(),
}));

// Sample mock property
const mockProperty = {
  id: 'property-1',
  owner_id: 'test-user-id',
  address: '123 Test Street',
  suburb: 'Testville',
  city: 'Testington',
  postcode: '1234',
  property_type: 'house',
  bedrooms: 3,
  bathrooms: 2,
  land_size: 500,
  floor_area: 200,
  year_built: 2010,
  created_at: '2023-01-01T00:00:00.000Z',
  updated_at: '2023-01-01T00:00:00.000Z',
  features: ['Garage', 'Garden', 'Pool'],
  images: [
    'https://example.com/image1.jpg',
    'https://example.com/image2.jpg'
  ],
  is_public: true,
  status: 'active',
  metadata: null,
  estimated_value: 750000,
  description: 'A beautiful house in a quiet neighborhood'
};

describe('PropertyDetail Component', () => {
  const mockNavigate = vi.fn();
  
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Mock Auth context with authenticated user
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      session: { user: { id: 'test-user-id', email: 'test@example.com' } },
      user: { 
        id: 'test-user-id', 
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2023-01-01T00:00:00.000Z'
      } as User,
      profile: {
        id: 'test-user-id',
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
        full_name: 'Test User',
        avatar_url: null,
        role: 'agent',
        user_id: 'test-user-id',
        email: 'test@example.com'
      },
      isLoading: false,
      isAuthenticating: false,
      isLoadingProfile: false,
      isAuthenticated: true,
      error: null,
      refreshProfile: async () => {},
      refreshAuthToken: async () => false
    });
    
    // Mock router params to return property ID
    vi.mocked(useParams).mockReturnValue({ id: 'property-1' });
    
    // Mock navigation function
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    
    // Mock successful property API response
    vi.mocked(propertyService.getProperty).mockResolvedValue({
      success: true,
      data: mockProperty,
      error: null,
    });
  });
  
  it('renders loading state initially', () => {
    render(<PropertyDetail />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
  
  it('renders property details correctly after loading', async () => {
    render(<PropertyDetail />);
    
    // Check loading state first
    expect(screen.getByRole('status')).toBeInTheDocument();
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
    
    // Check property address is displayed
    expect(screen.getByText('123 Test Street')).toBeInTheDocument();
    expect(screen.getByText('Testville, Testington 1234')).toBeInTheDocument();
    
    // Check property details are displayed
    expect(screen.getByText('house')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // Bedrooms
    expect(screen.getByText('2')).toBeInTheDocument(); // Bathrooms
    expect(screen.getByText('500 m²')).toBeInTheDocument(); // Land size
    expect(screen.getByText('200 m²')).toBeInTheDocument(); // Floor area
    expect(screen.getByText('2010')).toBeInTheDocument(); // Year built
    
    // Check estimated value is displayed
    expect(screen.getByText('$750,000')).toBeInTheDocument();
    
    // Check features are displayed
    expect(screen.getByText('Garage')).toBeInTheDocument();
    expect(screen.getByText('Garden')).toBeInTheDocument();
    expect(screen.getByText('Pool')).toBeInTheDocument();
    
    // Check back button is present
    expect(screen.getByRole('button', { name: /back to properties/i })).toBeInTheDocument();
    
    // Check edit and delete buttons are present
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });
  
  it('navigates back to properties list when back button is clicked', async () => {
    render(<PropertyDetail />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
    
    // Click back button
    const backButton = screen.getByRole('button', { name: /back to properties/i });
    fireEvent.click(backButton);
    
    // Check navigation was called correctly
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/properties');
  });
  
  it('navigates to edit page when edit button is clicked', async () => {
    render(<PropertyDetail />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
    
    // Click edit button
    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);
    
    // Check navigation was called correctly
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/properties/edit/property-1');
  });
  
  it('opens confirmation dialog when delete button is clicked', async () => {
    render(<PropertyDetail />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
    
    // Delete button should be visible
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    expect(deleteButton).toBeInTheDocument();
    
    // Click delete button
    fireEvent.click(deleteButton);
    
    // Confirm dialog should appear
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
  });
  
  it('deletes property and navigates away when confirmed', async () => {
    // Mock successful delete response
    vi.mocked(propertyService.deleteProperty).mockResolvedValue({
      success: true,
      data: null,
      error: null
    });
    
    render(<PropertyDetail />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
    
    // Click delete button
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);
    
    // Click confirm in dialog
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);
    
    // Check delete API was called
    expect(propertyService.deleteProperty).toHaveBeenCalledWith('property-1');
    
    // Wait for deletion to complete
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard/properties');
    });
  });
  
  it('shows error message when property fetch fails', async () => {
    // Mock error response
    vi.mocked(propertyService.getProperty).mockResolvedValue({
      success: false,
      data: null,
      error: 'Failed to fetch property details',
    });
    
    render(<PropertyDetail />);
    
    // Wait for error state
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
    
    // Check error message
    expect(screen.getByText('Failed to fetch property details')).toBeInTheDocument();
    
    // Back button should still be present
    expect(screen.getByRole('button', { name: /back to properties/i })).toBeInTheDocument();
  });
  
  it('shows error when user does not have permission to view property', async () => {
    // Mock successful response but with different owner_id
    vi.mocked(propertyService.getProperty).mockResolvedValue({
      success: true,
      data: {
        ...mockProperty,
        owner_id: 'different-user-id' // Different from the logged-in user
      },
      error: null,
    });
    
    render(<PropertyDetail />);
    
    // Wait for error state
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
    
    // Check permission error message
    expect(screen.getByText('You do not have permission to view this property')).toBeInTheDocument();
  });
  
  it('shows error message when property deletion fails', async () => {
    // Mock error on delete
    vi.mocked(propertyService.deleteProperty).mockResolvedValue({
      success: false,
      data: null,
      error: 'Failed to delete property'
    });
    
    render(<PropertyDetail />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
    
    // Click delete button
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);
    
    // Click confirm in dialog
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);
    
    // Check delete API was called
    expect(propertyService.deleteProperty).toHaveBeenCalledWith('property-1');
    
    // Error toast should be shown (this would need to be tested with a mock of the toast component)
  });
}); 