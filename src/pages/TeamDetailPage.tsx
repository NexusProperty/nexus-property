import { Helmet } from "react-helmet-async";
import { TeamDetail } from "@/components/team/TeamDetail";

export default function TeamDetailPage() {
  return (
    <>
      <Helmet>
        <title>Team Details | AppraisalHub</title>
        <meta name="description" content="View and manage your team details" />
      </Helmet>
      <div className="container py-6">
        <TeamDetail />
      </div>
    </>
  );
} 