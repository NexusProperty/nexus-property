import React from 'react';
import { useForm } from 'react-hook-form';

export type IntegrationFormValues = {
  name: string;
  provider: string;
  apiKey: string;
  refreshInterval: number;
  status: boolean;
};

const PROVIDERS = [
  { value: 'CoreLogic', label: 'CoreLogic' },
  { value: 'REINZ', label: 'REINZ' },
  { value: 'Council', label: 'Council Data' },
  { value: 'School', label: 'School Zones' },
  { value: 'Mapping', label: 'Mapping' },
];

interface Props {
  integration?: Partial<IntegrationFormValues>;
  onSave: (values: IntegrationFormValues) => void;
  onCancel: () => void;
}

export default function IntegrationDetailForm({ integration, onSave, onCancel }: Props) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<IntegrationFormValues>({
    defaultValues: integration || {
      name: '',
      provider: '',
      apiKey: '',
      refreshInterval: 60,
      status: true,
    },
  });

  React.useEffect(() => {
    reset(integration || {
      name: '',
      provider: '',
      apiKey: '',
      refreshInterval: 60,
      status: true,
    });
  }, [integration, reset]);

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4 p-4 max-w-md mx-auto bg-white rounded shadow">
      <div>
        <label className="block font-medium mb-1">Integration Name</label>
        <input
          {...register('name', { required: 'Name is required' })}
          className="w-full border rounded px-2 py-1"
        />
        {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
      </div>
      <div>
        <label className="block font-medium mb-1">Provider</label>
        <select
          {...register('provider', { required: 'Provider is required' })}
          className="w-full border rounded px-2 py-1"
        >
          <option value="">Select provider...</option>
          {PROVIDERS.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        {errors.provider && <span className="text-red-500 text-xs">{errors.provider.message}</span>}
      </div>
      <div>
        <label className="block font-medium mb-1">API Key / Credentials</label>
        <input
          {...register('apiKey', { required: 'API Key is required' })}
          className="w-full border rounded px-2 py-1"
        />
        {errors.apiKey && <span className="text-red-500 text-xs">{errors.apiKey.message}</span>}
      </div>
      <div>
        <label className="block font-medium mb-1">Refresh Interval (minutes)</label>
        <input
          type="number"
          {...register('refreshInterval', { required: true, min: 1 })}
          className="w-full border rounded px-2 py-1"
        />
        {errors.refreshInterval && <span className="text-red-500 text-xs">Refresh interval must be at least 1 minute</span>}
      </div>
      <div className="flex items-center">
        <input
          type="checkbox"
          {...register('status')}
          className="mr-2"
        />
        <span className="font-medium">Active</span>
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300">Cancel</button>
        <button type="submit" className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">Save</button>
      </div>
    </form>
  );
} 