import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchCustomerAppraisals } from "@/services/appraisalService";
import { Appraisal, AppraisalStatus } from "@/types/appraisal";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatCurrency } from "@/lib/utils";
import { FileText, ArrowRight } from "lucide-react";

// Status badge component
const StatusBadge = ({ status }: { status: AppraisalStatus }) => {
  const statusConfig: Record<AppraisalStatus, { label: string; color: string }> = {
    draft: { 
      label: "Draft", 
      color: "bg-gray-500" 
    },
    processing: { 
      label: "Processing", 
      color: "bg-blue-500" 
    },
    published: { 
      label: "Published", 
      color: "bg-green-500" 
    },
    claimed: { 
      label: "Claimed", 
      color: "bg-purple-500" 
    },
    completed: { 
      label: "Completed", 
      color: "bg-teal-500" 
    },
    cancelled: { 
      label: "Cancelled", 
      color: "bg-red-500" 
    }
  };

  const { label, color } = statusConfig[status];

  return (
    <Badge className={`${color} text-white`}>
      {label}
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
          {appraisal.estimated_value_min && appraisal.estimated_value_max && (
            <p className="mt-2 font-medium text-foreground">
              Estimated Value: {formatCurrency(appraisal.estimated_value_min)} - {formatCurrency(appraisal.estimated_value_max)}
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" className="w-full" onClick={onClick}>
          <FileText className="mr-2 h-4 w-4" />
          View Details
          <ArrowRight className="ml-2 h-4 w-4" />
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

// Error state
const ErrorState = ({ onRetry }: { onRetry: () => void }) => {
  return (
    <div className="text-center py-12">
      <h3 className="text-lg font-medium mb-2">Error loading appraisals</h3>
      <p className="text-muted-foreground mb-4">
        There was a problem loading your appraisals. Please try again later.
      </p>
      <Button onClick={onRetry}>Retry</Button>
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

  const handleRetry = () => window.location.reload();
  const handleViewDetails = (id: string) => navigate(`/appraisals/${id}`);

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
    return <ErrorState onRetry={handleRetry} />;
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
          onClick={() => handleViewDetails(appraisal.id)}
        />
      ))}
    </div>
  );
};
