import React from 'react';
import { PropertyForm } from '@/components/properties/PropertyForm';

export default function NewPropertyPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Add New Property</h2>
      </div>
      
      <PropertyForm />
    </div>
  );
} 