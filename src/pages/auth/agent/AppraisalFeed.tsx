import { Helmet } from "react-helmet-async";
import { AppraisalFeed } from "@/components/appraisal/AppraisalFeed";

export default function AppraisalFeedPage() {
  return (
    <>
      <Helmet>
        <title>Appraisal Feed | AppraisalHub</title>
        <meta name="description" content="Browse and claim appraisal leads" />
      </Helmet>
      <div className="container py-6">
        <AppraisalFeed />
      </div>
    </>
  );
} 