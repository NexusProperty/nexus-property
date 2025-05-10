import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

export const CustomerAppraisalsPage = () => {
  const appraisals = [
    { id: 1, property: "123 Main St", date: "2024-03-15", status: "completed", value: "$450,000" },
    { id: 2, property: "456 Oak Ave", date: "2024-03-20", status: "processing", value: "Pending" },
    { id: 3, property: "789 Pine Rd", date: "2024-03-25", status: "scheduled", value: "Pending" },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      completed: "default",
      processing: "secondary",
      scheduled: "outline"
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Appraisals</h1>
        <Button asChild>
          <Link to="/customer/appraisals/request">
            <Plus className="mr-2 h-4 w-4" />
            Request Appraisal
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appraisal History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appraisals.map((appraisal) => (
                <TableRow key={appraisal.id}>
                  <TableCell>{appraisal.property}</TableCell>
                  <TableCell>{appraisal.date}</TableCell>
                  <TableCell>{getStatusBadge(appraisal.status)}</TableCell>
                  <TableCell>{appraisal.value}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" asChild>
                      <Link to={`/customer/appraisals/${appraisal.id}`}>View Details</Link>
                    </Button>
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