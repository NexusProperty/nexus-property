import React from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppraisalList } from "@/components/appraisal/AppraisalList";

const CustomerAppraisals: React.FC = () => {
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
          <Link to="/appraisals/create">
            <Plus className="mr-2 h-4 w-4" />
            New Appraisal
          </Link>
        </Button>
      </div>
      
      <AppraisalList />
    </div>
  );
};

export default CustomerAppraisals;
