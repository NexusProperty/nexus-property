import { Helmet } from "react-helmet-async";
import { CreateTeamForm } from "@/components/team/CreateTeamForm";

export default function CreateTeamPage() {
  return (
    <>
      <Helmet>
        <title>Create Team | AppraisalHub</title>
        <meta name="description" content="Create a new appraisal team" />
      </Helmet>
      <div className="container py-6">
        <CreateTeamForm />
      </div>
    </>
  );
} 