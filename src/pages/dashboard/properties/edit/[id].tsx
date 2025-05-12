import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PropertyForm } from '@/components/properties/PropertyForm';
import { getProperty } from '@/services/property';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Database } from '@/types/supabase';

type Property = Database['public']['Tables']['properties']['Row'];

export default function EditPropertyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !user) return;

    const fetchProperty = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getProperty(id);
        if (result.success && result.data) {
          // Check if user has permission to edit this property
          if (result.data.owner_id !== user.id) {
            setError('You do not have permission to edit this property');
            setProperty(null);
          } else {
            setProperty(result.data);
          }
        } else {
          setError(result.error || 'Failed to fetch property details');
          setProperty(null);
        }
      } catch (err) {
        setError('An unexpected error occurred');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperty();
  }, [id, user]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => navigate('/dashboard/properties')}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Properties
        </Button>
        <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Property not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="outline" onClick={() => navigate(`/dashboard/properties/${id}`)}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Property
        </Button>
      </div>

      <div>
        <h2 className="text-3xl font-bold mb-2">Edit Property</h2>
        <p className="text-gray-500">
          Update the details for {property.address}
        </p>
      </div>

      <PropertyForm 
        initialData={property} 
        isEdit={true} 
      />
    </div>
  );
} 