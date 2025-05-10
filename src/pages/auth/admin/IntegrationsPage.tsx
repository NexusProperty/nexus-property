import React from 'react';
import IntegrationList from '@/components/integrations/IntegrationList';

const IntegrationsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold mb-4">Integration Management</h1>
      <IntegrationList />
    </div>
  );
};

export default IntegrationsPage; 