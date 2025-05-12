import React from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PropertyDetail } from '@/components/properties/PropertyDetail';
import { PropertyAccess } from '@/components/properties/PropertyAccess';

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  
  if (!id || !user) {
    return null;
  }

  return (
    <div className="space-y-8">
      <PropertyDetail />
      
      <PropertyAccess 
        propertyId={id} 
        isOwner={true} // This would ideally be determined by checking if user.id === property.owner_id
      />
    </div>
  );
} 