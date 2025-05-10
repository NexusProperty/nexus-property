import { Helmet } from "react-helmet-async";
import { CreateAppraisalForm } from "@/components/appraisal/CreateAppraisalForm";

export default function CreateAppraisalPage() {
  return (
    <>
      <Helmet>
        <title>Create Appraisal | Nexus Property</title>
        <meta name="description" content="Create a new property appraisal request" />
      </Helmet>
      
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Create New Appraisal</h1>
          <p className="text-muted-foreground mt-2">
            Fill out the form below to request a property appraisal. Our agents will review your request and provide a detailed valuation.
          </p>
        </div>
        
        <CreateAppraisalForm />
      </div>
    </>
  );
} 