import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const TeamDetailPage = () => {
  const { teamId } = useParams();
  
  // Mock data - replace with actual data fetching
  const team = {
    id: teamId,
    name: "Alpha Team",
    members: [
      { id: 1, name: "John Doe", role: "Team Lead", status: "active" },
      { id: 2, name: "Jane Smith", role: "Appraiser", status: "active" },
      { id: 3, name: "Mike Johnson", role: "Appraiser", status: "inactive" },
    ],
    activeAppraisals: 3
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{team.name}</h1>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {team.members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.name}</TableCell>
                  <TableCell>{member.role}</TableCell>
                  <TableCell>
                    <Badge variant={member.status === "active" ? "default" : "secondary"}>
                      {member.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}; 