import { Helmet } from "react-helmet-async";
import { AppraisalDetail } from "@/components/appraisal/AppraisalDetail";

const AppraisalDetailPage = () => {
  return (
    <>
      <Helmet>
        <title>Appraisal Details | Nexus Property</title>
        <meta name="description" content="View detailed information about your property appraisal" />
      </Helmet>
      
      <div className="container py-8">
        <AppraisalDetail />
      </div>
    </>
  );
};

export default AppraisalDetailPage; 