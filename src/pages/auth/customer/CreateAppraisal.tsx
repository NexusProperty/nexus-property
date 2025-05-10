import React from "react";
import { CreateAppraisalForm } from "@/components/appraisal/CreateAppraisalForm";

const CreateAppraisal: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Create New Appraisal</h1>
        <p className="text-muted-foreground">
          Get a free property appraisal by providing your property details
        </p>
      </div>
      
      <CreateAppraisalForm />
    </div>
  );
};

export default CreateAppraisal; 