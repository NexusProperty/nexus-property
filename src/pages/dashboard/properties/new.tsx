import React from 'react';
import { MultiStepPropertyForm } from '@/components/properties/MultiStepPropertyForm';

export default function NewPropertyPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Add New Property</h2>
      </div>
      
      <MultiStepPropertyForm />
    </div>
  );
} 