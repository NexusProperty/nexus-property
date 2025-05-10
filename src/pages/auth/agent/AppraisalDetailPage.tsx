import { Helmet } from "react-helmet-async";
import { AppraisalDetail } from "@/components/appraisal/AppraisalDetail";

export const AppraisalDetailPage = () => {
  return (
    <>
      <Helmet>
        <title>Appraisal Details | AppraisalHub</title>
        <meta name="description" content="View detailed information about a property appraisal" />
      </Helmet>
      <div className="container py-6">
        <AppraisalDetail />
      </div>
    </>
  );
}; 