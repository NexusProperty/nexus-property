import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchCustomerAppraisals } from "@/services/appraisalService";
import { Appraisal } from "@/types/appraisal";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-500";
      case "processing":
        return "bg-blue-500";
      case "published":
        return "bg-green-500";
      case "claimed":
        return "bg-purple-500";
      case "completed":
        return "bg-teal-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "draft":
        return "Draft";
      case "processing":
        return "Processing";
      case "published":
        return "Published";
      case "claimed":
        return "Claimed";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  return (
    <Badge className={`${getStatusColor(status)} text-white`}>
      {getStatusLabel(status)}
    </Badge>
  );
};

// Appraisal card component
const AppraisalCard = ({ appraisal, onClick }: { appraisal: Appraisal, onClick: () => void }) => {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium line-clamp-1">
            {appraisal.property_address}
          </CardTitle>
          <StatusBadge status={appraisal.status} />
        </div>
      </CardHeader>
      <CardContent className="pb-2 flex-grow">
        <div className="text-sm text-muted-foreground">
          <p>Created: {formatDate(appraisal.created_at)}</p>
          {appraisal.updated_at && (
            <p>Updated: {formatDate(appraisal.updated_at)}</p>
          )}
          {appraisal.estimated_value_min && appraisal.estimated_value_max && (
            <p className="mt-2 font-medium text-foreground">
              Estimated Value: ${appraisal.estimated_value_min.toLocaleString()} - ${appraisal.estimated_value_max.toLocaleString()}
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" asChild className="w-full" onClick={onClick}>
          <Link to={`/appraisals/${appraisal.id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

// Loading skeleton
const AppraisalCardSkeleton = () => {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-5 w-20" />
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <Skeleton className="h-4 w-1/2 mb-2" />
        <Skeleton className="h-4 w-1/3" />
      </CardContent>
      <CardFooter>
        <Skeleton className="h-9 w-full" />
      </CardFooter>
    </Card>
  );
};

// Empty state
const EmptyState = () => {
  return (
    <div className="text-center py-12">
      <h3 className="text-lg font-medium mb-2">No appraisals found</h3>
      <p className="text-muted-foreground mb-4">
        You haven't created any appraisals yet.
      </p>
      <Button asChild>
        <Link to="/appraisals/create">Create Your First Appraisal</Link>
      </Button>
    </div>
  );
};

// Main component
export const AppraisalList = () => {
  const { data: appraisals, isLoading, error } = useQuery({
    queryKey: ["appraisals"],
    queryFn: fetchCustomerAppraisals,
  });
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <AppraisalCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium mb-2">Error loading appraisals</h3>
        <p className="text-muted-foreground mb-4">
          There was a problem loading your appraisals. Please try again later.
        </p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  if (!appraisals || appraisals.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {appraisals.map((appraisal) => (
        <AppraisalCard 
          key={appraisal.id} 
          appraisal={appraisal} 
          onClick={() => navigate(`/appraisals/${appraisal.id}`)}
        />
      ))}
    </div>
  );
};
