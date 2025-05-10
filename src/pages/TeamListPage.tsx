import { Helmet } from "react-helmet-async";
import { TeamList } from "@/components/team/TeamList";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TeamListPage() {
  const navigate = useNavigate();
  
  return (
    <>
      <Helmet>
        <title>Teams | AppraisalHub</title>
        <meta name="description" content="Manage your appraisal teams" />
      </Helmet>
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Teams</h1>
          <Button onClick={() => navigate("/agent/team/create")}>
            <Plus className="mr-2 h-4 w-4" />
            Create Team
          </Button>
        </div>
        <TeamList />
      </div>
    </>
  );
} 