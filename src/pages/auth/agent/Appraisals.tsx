import React from "react";
import { AgentAppraisals } from "@/components/appraisal/AgentAppraisals";

const AgentAppraisalsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">My Appraisals</h1>
        <p className="text-muted-foreground">
          View and manage your claimed property appraisals
        </p>
      </div>
      
      <AgentAppraisals />
    </div>
  );
};

export default AgentAppraisalsPage; 