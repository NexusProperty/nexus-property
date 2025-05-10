import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, formatCurrency } from "@/lib/utils";
import { MapPin, Calendar, DollarSign, Home, Users, FileText, CheckCircle, XCircle } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { fetchAgentAppraisals, completeAppraisal } from "@/services/appraisalService";

// Mock data for a single appraisal
const mockAppraisal = {
  id: "1",
  property_address: "123 Main Street, Auckland",
  property_type: "Residential",
  bedrooms: 3,
  bathrooms: 2,
  land_size: 500,
  created_at: "2023-06-15T10:30:00Z",
  status: "claimed",
  estimated_value_min: 850000,
  estimated_value_max: 950000,
  customer_name: "John Smith",
  customer_email: "john.smith@example.com",
  customer_phone: "+64 21 123 4567",
  agent_id: "agent123",
  claimed_at: "2023-06-16T09:15:00Z",
  agent_notes: "Customer is looking to sell within the next 3 months. Property has been recently renovated.",
};

export const AppraisalDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [finalValue, setFinalValue] = useState<number>(0);
  const [completionNotes, setCompletionNotes] = useState<string>("");

  // In a real implementation, this would fetch data from an API
  const { data: appraisal, isLoading, error } = useQuery({
    queryKey: ["appraisal", id],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return mockAppraisal;
    },
  });

  const completeAppraisalMutation = useMutation({
    mutationFn: ({ appraisalId, finalValue, notes }: { appraisalId: string, finalValue: number, notes?: string }) => 
      completeAppraisal(appraisalId, finalValue, notes),
    onSuccess: () => {
      toast({
        title: "Appraisal completed",
        description: "The appraisal has been marked as completed successfully.",
      });
      setIsCompleteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["appraisal", id] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "There was a problem completing the appraisal. Please try again.",
        variant: "destructive",
      });
      console.error("Error completing appraisal:", error);
    },
  });

  const handleComplete = () => {
    if (!id) return;
    completeAppraisalMutation.mutate({
      appraisalId: id,
      finalValue,
      notes: completionNotes,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[200px]" />
        </div>
        <Skeleton className="h-[300px]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium mb-2">Error loading appraisal</h3>
        <p className="text-muted-foreground mb-4">
          There was a problem loading the appraisal details. Please try again later.
        </p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  if (!appraisal) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium mb-2">Appraisal not found</h3>
        <p className="text-muted-foreground mb-4">
          The appraisal you are looking for does not exist or you don't have permission to view it.
        </p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{appraisal.property_address}</h1>
          <p className="text-muted-foreground mt-1">
            {appraisal.property_type} • {appraisal.bedrooms} beds • {appraisal.bathrooms} baths
          </p>
        </div>
        <Badge variant={appraisal.status === "completed" ? "default" : "outline"} className="capitalize">
          {appraisal.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Property Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{appraisal.property_address}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Home className="h-4 w-4 text-muted-foreground" />
                <span>{appraisal.property_type}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Requested: {formatDate(appraisal.created_at)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>
                  Est. Value: {formatCurrency(appraisal.estimated_value_min)} - {formatCurrency(appraisal.estimated_value_max)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{appraisal.customer_name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-muted-foreground">Email:</span>
                <span>{appraisal.customer_email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-muted-foreground">Phone:</span>
                <span>{appraisal.customer_phone}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Appraisal Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={appraisal.status === "completed" ? "default" : "outline"} className="capitalize">
                  {appraisal.status}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-muted-foreground">Requested:</span>
                <span>{formatDate(appraisal.created_at)}</span>
              </div>
              {appraisal.claimed_at && (
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground">Claimed:</span>
                  <span>{formatDate(appraisal.claimed_at)}</span>
                </div>
              )}
              {appraisal.status === "completed" && (
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground">Completed:</span>
                  <span>{formatDate(appraisal.completed_at || "")}</span>
                </div>
              )}
            </div>
          </CardContent>
          {appraisal.status === "claimed" && (
            <CardFooter>
              <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Complete Appraisal
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Complete Appraisal</DialogTitle>
                    <DialogDescription>
                      Enter the final appraisal value and any notes about the completion.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="final-value">Final Appraisal Value</Label>
                      <Input
                        id="final-value"
                        type="number"
                        min="0"
                        value={finalValue}
                        onChange={(e) => setFinalValue(Number(e.target.value))}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="completion-notes">Completion Notes</Label>
                      <Textarea
                        id="completion-notes"
                        placeholder="Enter any notes about the appraisal completion"
                        value={completionNotes}
                        onChange={(e) => setCompletionNotes(e.target.value)}
                        rows={4}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCompleteDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleComplete}
                      disabled={completeAppraisalMutation.isPending || finalValue <= 0}
                    >
                      {completeAppraisalMutation.isPending ? "Completing..." : "Complete Appraisal"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          )}
        </Card>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="report">Report</TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Property Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Property Type:</span>
                      <span>{appraisal.property_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bedrooms:</span>
                      <span>{appraisal.bedrooms}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bathrooms:</span>
                      <span>{appraisal.bathrooms}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Land Size:</span>
                      <span>{appraisal.land_size} m²</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Valuation</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Estimated Value Range:</span>
                      <span>
                        {formatCurrency(appraisal.estimated_value_min)} - {formatCurrency(appraisal.estimated_value_max)}
                      </span>
                    </div>
                    {appraisal.status === "completed" && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Final Value:</span>
                        <span className="font-medium">{formatCurrency(appraisal.final_value || 0)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {appraisal.agent_notes ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Agent Notes</h3>
                    <p className="text-muted-foreground">{appraisal.agent_notes}</p>
                  </div>
                  {appraisal.completion_notes && (
                    <div>
                      <h3 className="font-medium mb-2">Completion Notes</h3>
                      <p className="text-muted-foreground">{appraisal.completion_notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No notes available for this appraisal.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="report" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Appraisal Report</CardTitle>
            </CardHeader>
            <CardContent>
              {appraisal.status === "completed" ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Appraisal Report Available</h3>
                  <p className="text-muted-foreground mb-4">
                    The appraisal report has been generated and is ready for viewing.
                  </p>
                  <Button>
                    <FileText className="mr-2 h-4 w-4" />
                    View Report
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <XCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Report Not Available</h3>
                  <p className="text-muted-foreground">
                    The appraisal report will be generated once the appraisal is completed.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 