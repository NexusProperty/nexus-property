import React from 'react';
import { render, screen, waitFor } from '@/test-utils';
import IntegrationList from './IntegrationList';
import * as integrationService from '@/services/integrationService';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';

jest.mock('@/services/integrationService');

const mockIntegrations = [
  { id: '1', name: 'CoreLogic', provider: 'CoreLogic', status: 'active' },
  { id: '2', name: 'REINZ', provider: 'REINZ', status: 'inactive' },
];

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient();
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('IntegrationList', () => {
  afterEach(() => jest.clearAllMocks());

  it('renders loading state', async () => {
    (integrationService.fetchUserIntegrations as jest.Mock).mockReturnValue(new Promise(() => {}));
    renderWithClient(<IntegrationList />);
    expect(screen.getByText(/loading integrations/i)).toBeInTheDocument();
  });

  it('renders error state', async () => {
    (integrationService.fetchUserIntegrations as jest.Mock).mockImplementation(() => { throw new Error('fail'); });
    renderWithClient(<IntegrationList />);
    await waitFor(() => expect(screen.getByText(/error loading integrations/i)).toBeInTheDocument());
  });

  it('renders empty state', async () => {
    (integrationService.fetchUserIntegrations as jest.Mock).mockResolvedValue([]);
    renderWithClient(<IntegrationList />);
    await waitFor(() => expect(screen.getByText(/no integrations found/i)).toBeInTheDocument());
  });

  it('renders integrations table with correct columns and status', async () => {
    (integrationService.fetchUserIntegrations as jest.Mock).mockResolvedValue(mockIntegrations);
    renderWithClient(<IntegrationList />);
    await waitFor(() => expect(screen.getByText('CoreLogic')).toBeInTheDocument());
    expect(screen.getByText('REINZ')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(3); // header + 2 rows
    expect(screen.getAllByText(/active|inactive/i)).toBeTruthy();
  });

  it('has accessible table and filter input', async () => {
    (integrationService.fetchUserIntegrations as jest.Mock).mockResolvedValue(mockIntegrations);
    renderWithClient(<IntegrationList />);
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());
    expect(screen.getByPlaceholderText(/filter by name/i)).toBeInTheDocument();
  });

  it('filters integrations by name or provider', async () => {
    (integrationService.fetchUserIntegrations as jest.Mock).mockResolvedValue(mockIntegrations);
    renderWithClient(<IntegrationList />);
    await waitFor(() => expect(screen.getByText('CoreLogic')).toBeInTheDocument());
    const input = screen.getByPlaceholderText(/filter by name/i);
    userEvent.type(input, 'REINZ');
    expect(await screen.findByText('REINZ')).toBeInTheDocument();
    expect(screen.queryByText('CoreLogic')).not.toBeInTheDocument();
  });

  it('sorts integrations by column', async () => {
    (integrationService.fetchUserIntegrations as jest.Mock).mockResolvedValue(mockIntegrations);
    renderWithClient(<IntegrationList />);
    await waitFor(() => expect(screen.getByText('CoreLogic')).toBeInTheDocument());
    const providerHeader = screen.getByText(/provider/i);
    userEvent.click(providerHeader);
    // After sort, first row should be CoreLogic (alphabetical)
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('CoreLogic');
    userEvent.click(providerHeader);
    // After reverse sort, first row should be REINZ
    expect(rows[1]).toHaveTextContent('REINZ');
  });

  it('calls edit handler when Edit is clicked', async () => {
    (integrationService.fetchUserIntegrations as jest.Mock).mockResolvedValue(mockIntegrations);
    renderWithClient(<IntegrationList />);
    await waitFor(() => expect(screen.getByText('CoreLogic')).toBeInTheDocument());
    const editButtons = screen.getAllByText('Edit');
    userEvent.click(editButtons[0]);
    expect(screen.getByText(/integration management/i)).toBeInTheDocument(); // Form/modal appears
  });

  it('calls delete handler and confirms', async () => {
    (integrationService.fetchUserIntegrations as jest.Mock).mockResolvedValue(mockIntegrations);
    (integrationService.deleteIntegration as jest.Mock).mockResolvedValue({});
    window.confirm = jest.fn(() => true);
    renderWithClient(<IntegrationList />);
    await waitFor(() => expect(screen.getByText('CoreLogic')).toBeInTheDocument());
    const deleteButtons = screen.getAllByText('Delete');
    userEvent.click(deleteButtons[0]);
    expect(window.confirm).toHaveBeenCalled();
    // Optionally check for mutation call
    expect(integrationService.deleteIntegration).toHaveBeenCalledWith('1');
  });
});

describe('IntegrationList API integration', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('handles API error and allows retry', async () => {
    // Simulate error on first call, success on retry
    const fetchMock = integrationService.fetchUserIntegrations as jest.Mock;
    fetchMock.mockRejectedValueOnce(new Error('API fail')).mockResolvedValueOnce(mockIntegrations);
    renderWithClient(<IntegrationList />);
    await waitFor(() => expect(screen.getByText(/error loading integrations/i)).toBeInTheDocument());
    // Simulate retry (could be a button or re-mount)
    // For this example, re-render to simulate retry
    renderWithClient(<IntegrationList />);
    await waitFor(() => expect(screen.getByText('CoreLogic')).toBeInTheDocument());
  });

  it('cleans up after each test', async () => {
    // This test ensures no state leaks between tests
    (integrationService.fetchUserIntegrations as jest.Mock).mockResolvedValue([]);
    renderWithClient(<IntegrationList />);
    await waitFor(() => expect(screen.getByText(/no integrations found/i)).toBeInTheDocument());
  });

  // Add more fallback or edge case tests as needed
}); 