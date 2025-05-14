import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, HomeIcon, BadgeInfo, MapPin } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';

// Example property data type
interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  type: string;
  status: string;
  lastAppraisal?: {
    date: Date;
    value: number;
  };
  dateAdded: Date;
}

interface PropertyOverviewCardsProps {
  properties: Property[];
}

const PropertyOverviewCards: React.FC<PropertyOverviewCardsProps> = ({ properties }) => {
  // Function to determine badge color based on property status
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (properties.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-6">
            <HomeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No properties</h3>
            <p className="mt-1 text-sm text-gray-500">You haven't added any properties yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {properties.map((property) => (
        <Card key={property.id} className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-base">{property.address}</CardTitle>
              <Badge className={getStatusColor(property.status)}>
                {property.status}
              </Badge>
            </div>
            <CardDescription className="flex items-center mt-1">
              <MapPin className="h-3.5 w-3.5 mr-1" />
              {property.city}, {property.state} {property.zipCode}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex flex-col">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium">{property.type}</span>
              </div>
              {property.lastAppraisal && (
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Last Valuation</span>
                  <span className="font-medium">
                    ${property.lastAppraisal.value.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="pt-1 text-xs text-muted-foreground border-t">
            <div className="flex items-center">
              <CalendarIcon className="h-3.5 w-3.5 mr-1" />
              Added {formatDistanceToNow(property.dateAdded, { addSuffix: true })}
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default PropertyOverviewCards; 