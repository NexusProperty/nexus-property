import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUserIntegrations, createIntegration, updateIntegration, deleteIntegration } from '@/services/integrationService';
import IntegrationStatusIndicator from './IntegrationStatusIndicator';
import IntegrationDetailForm, { IntegrationFormValues } from './IntegrationDetailForm';

// Integration type for UI
export type Integration = {
  id: string;
  name: string;
  provider: string;
  status: 'active' | 'inactive' | 'error';
};

const statusColors = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  error: 'bg-red-100 text-red-800',
};

export default function IntegrationList() {
  const queryClient = useQueryClient();
  const { data: integrations = [], isLoading, isError } = useQuery({
    queryKey: ['integrations'],
    queryFn: fetchUserIntegrations,
  });
  const [filter, setFilter] = React.useState('');
  const [sortKey, setSortKey] = React.useState<'name' | 'provider' | 'status'>('name');
  const [sortAsc, setSortAsc] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [editing, setEditing] = React.useState<Integration | null>(null);

  // Mutations
  const createMutation = useMutation({
    mutationFn: createIntegration,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['integrations'] }),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<IntegrationFormValues> }) => updateIntegration(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['integrations'] }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteIntegration(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['integrations'] }),
  });

  // Sorting logic
  const sortedIntegrations = [...integrations]
    .filter(i =>
      i.name.toLowerCase().includes(filter.toLowerCase()) ||
      i.provider.toLowerCase().includes(filter.toLowerCase())
    )
    .sort((a, b) => {
      if (a[sortKey] < b[sortKey]) return sortAsc ? -1 : 1;
      if (a[sortKey] > b[sortKey]) return sortAsc ? 1 : -1;
      return 0;
    });

  // Convert Integration to IntegrationFormValues for editing
  const integrationToFormValues = (integration: Integration): IntegrationFormValues => ({
    name: integration.name,
    provider: integration.provider,
    apiKey: '', // Not available in Integration, left blank for editing
    refreshInterval: 60, // Default or fetch from integration if available
    status: integration.status === 'active',
  });

  // Handlers
  const handleAdd = () => {
    setEditing(null);
    setShowForm(true);
  };
  const handleEdit = (integration: Integration) => {
    setEditing(integration);
    setShowForm(true);
  };
  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this integration?')) {
      deleteMutation.mutate(id);
    }
  };
  const handleSave = (values: IntegrationFormValues) => {
    if (editing) {
      updateMutation.mutate({ id: editing.id, updates: values });
    } else {
      createMutation.mutate(values);
    }
    setShowForm(false);
    setEditing(null);
  };
  const handleCancel = () => {
    setShowForm(false);
    setEditing(null);
  };

  return (
    <div className="p-4">
      <div className="flex items-center mb-4">
        <input
          type="text"
          placeholder="Filter by name or provider..."
          className="border rounded px-2 py-1 mr-4"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
        <button
          className="ml-auto px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
          onClick={handleAdd}
        >
          + Add Integration
        </button>
      </div>
      {showForm && (
        <IntegrationDetailForm
          integration={editing ? integrationToFormValues(editing) : undefined}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
      <div className="overflow-x-auto mt-4">
        <table className="min-w-full bg-white border rounded shadow">
          <thead>
            <tr>
              <th
                className="px-4 py-2 cursor-pointer"
                onClick={() => {
                  setSortKey('name');
                  setSortAsc(sortKey === 'name' ? !sortAsc : true);
                }}
              >
                Name {sortKey === 'name' && (sortAsc ? '▲' : '▼')}
              </th>
              <th
                className="px-4 py-2 cursor-pointer"
                onClick={() => {
                  setSortKey('provider');
                  setSortAsc(sortKey === 'provider' ? !sortAsc : true);
                }}
              >
                Provider {sortKey === 'provider' && (sortAsc ? '▲' : '▼')}
              </th>
              <th
                className="px-4 py-2 cursor-pointer"
                onClick={() => {
                  setSortKey('status');
                  setSortAsc(sortKey === 'status' ? !sortAsc : true);
                }}
              >
                Status {sortKey === 'status' && (sortAsc ? '▲' : '▼')}
              </th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                  Loading integrations...
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-red-500">
                  Error loading integrations.
                </td>
              </tr>
            ) : sortedIntegrations.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                  No integrations found.
                </td>
              </tr>
            ) : (
              sortedIntegrations.map((integration: Integration) => (
                <tr key={integration.id} className="border-t">
                  <td className="px-4 py-2 font-medium">{integration.name}</td>
                  <td className="px-4 py-2">{integration.provider}</td>
                  <td className="px-4 py-2">
                    <IntegrationStatusIndicator status={integration.status} />
                  </td>
                  <td className="px-4 py-2">
                    <button className="text-blue-600 hover:underline mr-2" onClick={() => handleEdit(integration)}>Edit</button>
                    <button className="text-red-600 hover:underline" onClick={() => handleDelete(integration.id)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 