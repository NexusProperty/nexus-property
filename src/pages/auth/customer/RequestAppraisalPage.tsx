import { Helmet } from "react-helmet-async";
import { RequestAppraisalForm } from "@/components/appraisal/RequestAppraisalForm";

export default function RequestAppraisalPage() {
  return (
    <>
      <Helmet>
        <title>Request Appraisal | AppraisalHub</title>
        <meta name="description" content="Request a property appraisal" />
      </Helmet>
      <div className="container py-6">
        <RequestAppraisalForm />
      </div>
    </>
  );
} 