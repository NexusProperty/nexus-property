import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PropertyForm } from '@/components/properties/PropertyForm';
import { getProperty } from '@/services/property';
import { Spinner } from '@/components/ui/spinner';
import { Database } from '@/types/supabase';

type Property = Database['public']['Tables']['properties']['Row'];

export default function EditPropertyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      navigate('/dashboard/properties');
      return;
    }

    const fetchProperty = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getProperty(id);
        if (result.success && result.data) {
          setProperty(result.data);
        } else {
          setError(result.error || 'Failed to load property');
        }
      } catch (err) {
        setError('An unexpected error occurred');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperty();
  }, [id, navigate]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  // Error state
  if (error || !property) {
    return (
      <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error || 'Property not found'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Edit Property</h2>
      </div>
      
      <PropertyForm initialData={property} isEdit={true} />
    </div>
  );
} 