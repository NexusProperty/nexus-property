import React from 'react';

interface Props {
  status: 'active' | 'inactive' | 'error';
  tooltip?: string;
}

const statusMap = {
  active: {
    color: 'bg-green-100 text-green-800',
    label: 'Active',
    icon: (
      <svg className="w-3 h-3 mr-1 inline-block text-green-500" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" /></svg>
    ),
  },
  inactive: {
    color: 'bg-gray-100 text-gray-800',
    label: 'Inactive',
    icon: (
      <svg className="w-3 h-3 mr-1 inline-block text-gray-400" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" /></svg>
    ),
  },
  error: {
    color: 'bg-red-100 text-red-800',
    label: 'Error',
    icon: (
      <svg className="w-3 h-3 mr-1 inline-block text-red-500" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" /></svg>
    ),
  },
};

export default function IntegrationStatusIndicator({ status, tooltip }: Props) {
  const { color, label, icon } = statusMap[status];
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${color}`}
      title={tooltip || label}
    >
      {icon}
      {label}
    </span>
  );
} 