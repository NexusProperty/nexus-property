
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppraisalList } from "@/components/appraisal/AppraisalList";
import { fetchCustomerAppraisals, publishAppraisal } from "@/services/appraisalService";
import { toast } from "@/components/ui/use-toast";

const CustomerAppraisals: React.FC = () => {
  const queryClient = useQueryClient();
  
  // Fetch appraisals
  const { data: appraisals = [], isLoading } = useQuery({
    queryKey: ['customerAppraisals'],
    queryFn: fetchCustomerAppraisals,
  });
  
  // Publish appraisal mutation
  const publishMutation = useMutation({
    mutationFn: publishAppraisal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerAppraisals'] });
    },
    onError: (error) => {
      console.error("Error publishing appraisal:", error);
      toast({
        title: "Error",
        description: "Failed to publish appraisal. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const handlePublish = (id: string) => {
    publishMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">My Appraisals</h1>
          <p className="text-muted-foreground">
            View and manage your property appraisals
          </p>
        </div>
        <Button size="sm" asChild>
          <Link to="/customer">
            <Plus className="mr-2 h-4 w-4" />
            New Appraisal
          </Link>
        </Button>
      </div>
      
      <AppraisalList 
        appraisals={appraisals} 
        isLoading={isLoading} 
        onPublish={handlePublish} 
      />
    </div>
  );
};

export default CustomerAppraisals;
