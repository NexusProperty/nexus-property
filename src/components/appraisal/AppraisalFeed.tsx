import { useState, useEffect } from "react";
import { Appraisal } from "@/types/appraisal";
import { fetchAppraisalFeed, claimAppraisal } from "@/services/agentService";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Link, useNavigate } from "react-router-dom";
import { Eye, Search, MapPin, Home, DollarSign, Calendar, ArrowRight } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatCurrency } from "@/lib/utils";

// Mock data for the appraisal feed
const mockAppraisals: Appraisal[] = [
  {
    id: "1",
    property_address: "123 Main Street, Auckland",
    property_type: "Residential",
    bedrooms: 3,
    bathrooms: 2,
    land_size: 500,
    created_at: "2023-06-15T10:30:00Z",
    status: "pending",
    estimated_value_min: 850000,
    estimated_value_max: 950000,
    customer_name: "John Smith",
    customer_email: "john.smith@example.com",
    customer_phone: "+64 21 123 4567",
  },
  {
    id: "2",
    property_address: "456 Queen Street, Wellington",
    property_type: "Apartment",
    bedrooms: 2,
    bathrooms: 1,
    land_size: 0,
    created_at: "2023-06-14T14:45:00Z",
    status: "pending",
    estimated_value_min: 650000,
    estimated_value_max: 750000,
    customer_name: "Sarah Johnson",
    customer_email: "sarah.j@example.com",
    customer_phone: "+64 21 987 6543",
  },
  {
    id: "3",
    property_address: "789 Beach Road, Christchurch",
    property_type: "Residential",
    bedrooms: 4,
    bathrooms: 2,
    land_size: 650,
    created_at: "2023-06-13T09:15:00Z",
    status: "pending",
    estimated_value_min: 950000,
    estimated_value_max: 1100000,
    customer_name: "Michael Brown",
    customer_email: "michael.b@example.com",
    customer_phone: "+64 21 456 7890",
  },
];

// Appraisal card component
const AppraisalCard = ({ appraisal }: { appraisal: Appraisal }) => {
  const [isClaimDialogOpen, setIsClaimDialogOpen] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  
  const handleClaim = () => {
    // In a real implementation, this would call an API to claim the appraisal
    toast({
      title: "Lead claimed",
      description: "You have successfully claimed this lead.",
    });
    setIsClaimDialogOpen(false);
  };
  
  const handleViewDetails = () => {
    navigate(`/agent/appraisals/${appraisal.id}`);
  };
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-medium">
              {appraisal.property_address}
            </CardTitle>
            <CardDescription>
              {appraisal.property_type} • {appraisal.bedrooms} beds • {appraisal.bathrooms} baths
            </CardDescription>
          </div>
          <Badge variant="outline" className="capitalize">
            {appraisal.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{appraisal.property_address}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Requested: {formatDate(appraisal.created_at)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              Est. Value: {formatCurrency(appraisal.estimated_value_min)} - {formatCurrency(appraisal.estimated_value_max)}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex space-x-2">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={handleViewDetails}
        >
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </Button>
        <Dialog open={isClaimDialogOpen} onOpenChange={setIsClaimDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex-1">
              Claim Lead
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Claim Lead</DialogTitle>
              <DialogDescription>
                You are about to claim this lead. The customer will be notified that you will be handling their appraisal.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="customer-name">Customer Name</Label>
                <Input id="customer-name" value={appraisal.customer_name} disabled />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="customer-email">Customer Email</Label>
                <Input id="customer-email" value={appraisal.customer_email} disabled />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="customer-phone">Customer Phone</Label>
                <Input id="customer-phone" value={appraisal.customer_phone} disabled />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="message">Initial Message (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Enter a message to send to the customer"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsClaimDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleClaim}>Claim Lead</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
};

// Loading skeleton
const AppraisalCardSkeleton = () => {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-5 w-20" />
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );
};

// Empty state
const EmptyState = () => {
  return (
    <div className="text-center py-12">
      <h3 className="text-lg font-medium mb-2">No leads available</h3>
      <p className="text-muted-foreground mb-4">
        There are currently no appraisal leads available in your area.
      </p>
      <p className="text-sm text-muted-foreground">
        Check back later for new opportunities.
      </p>
    </div>
  );
};

// Main component
export const AppraisalFeed = () => {
  const navigate = useNavigate();
  // In a real implementation, this would fetch data from an API
  const { data: appraisals, isLoading, error } = useQuery({
    queryKey: ["appraisal-feed"],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return mockAppraisals;
    },
  });
  
  if (isLoading) {
    return (
      <div>
        {Array.from({ length: 3 }).map((_, index) => (
          <AppraisalCardSkeleton key={index} />
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium mb-2">Error loading leads</h3>
        <p className="text-muted-foreground mb-4">
          There was a problem loading the appraisal leads. Please try again later.
        </p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }
  
  if (!appraisals || appraisals.length === 0) {
    return <EmptyState />;
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Appraisal Leads</h2>
        <div className="flex space-x-2">
          <Button variant="outline">Filter</Button>
          <Button variant="outline">Sort</Button>
        </div>
      </div>
      
      <div>
        {appraisals.map((appraisal) => (
          <AppraisalCard key={appraisal.id} appraisal={appraisal} />
        ))}
      </div>
    </div>
  );
}; 