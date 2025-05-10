
import React from "react";
import { AppraisalCard } from "./AppraisalCard";
import { Appraisal } from "@/types/appraisal";
import { Skeleton } from "@/components/ui/skeleton";

interface AppraisalListProps {
  appraisals: Appraisal[];
  isLoading: boolean;
  onPublish: (id: string) => void;
}

// Skeleton loader for appraisals
const AppraisalSkeleton: React.FC = () => (
  <div className="border rounded-lg p-4 h-64">
    <div className="flex justify-between items-start">
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-5 w-20" />
    </div>
    <Skeleton className="h-4 w-1/3 mt-4 mb-4" />
    <Skeleton className="h-20 w-full mt-4 mb-4" />
    <div className="flex gap-2 mt-4">
      <Skeleton className="h-9 w-32" />
      <Skeleton className="h-9 w-32" />
    </div>
  </div>
);

export const AppraisalList: React.FC<AppraisalListProps> = ({ 
  appraisals, 
  isLoading,
  onPublish
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <AppraisalSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (appraisals.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border">
        <h3 className="text-lg font-medium mb-2">No appraisals yet</h3>
        <p className="text-muted-foreground">
          You haven't created any appraisals yet. Start by getting a free property appraisal.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {appraisals.map((appraisal) => (
        <AppraisalCard 
          key={appraisal.id} 
          appraisal={appraisal} 
          onPublish={onPublish}
        />
      ))}
    </div>
  );
};
