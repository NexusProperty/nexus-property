import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchUserIntegrations } from '@/services/integrationService';

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
  const { data: integrations = [], isLoading, isError } = useQuery({
    queryKey: ['integrations'],
    queryFn: fetchUserIntegrations,
  });
  const [filter, setFilter] = React.useState('');
  const [sortKey, setSortKey] = React.useState<'name' | 'provider' | 'status'>('name');
  const [sortAsc, setSortAsc] = React.useState(true);

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
        <span className="ml-auto text-sm text-gray-500">
          Showing {sortedIntegrations.length} of {integrations.length}
        </span>
      </div>
      <div className="overflow-x-auto">
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
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${statusColors[integration.status]}`}>{integration.status}</span>
                  </td>
                  <td className="px-4 py-2">
                    <button className="text-blue-600 hover:underline mr-2">Edit</button>
                    <button className="text-red-600 hover:underline">Delete</button>
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