import { useState, useEffect } from "react";
import { Appraisal, AppraisalStatus } from "@/types/appraisal";
import { fetchAgentAppraisals } from "@/services/agentService";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Eye, Search, MapPin, Home, DollarSign, Calendar } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

// Status badge component
const StatusBadge = ({ status }: { status: AppraisalStatus }) => {
  const statusConfig = {
    draft: { label: "Draft", variant: "outline" as const },
    processing: { label: "Processing", variant: "secondary" as const },
    published: { label: "Published", variant: "default" as const },
    claimed: { label: "Claimed", variant: "secondary" as const },
    completed: { label: "Completed", variant: "default" as const },
    cancelled: { label: "Cancelled", variant: "destructive" as const },
    in_progress: { label: "In Progress", variant: "outline" as const }
  };

  const config = statusConfig[status] || { label: status, variant: "outline" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

// Loading skeleton component
const AppraisalsSkeleton = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton className="h-10 w-[250px]" />
      <Skeleton className="h-10 w-[200px]" />
    </div>
    {[1, 2, 3].map((i) => (
      <Skeleton key={i} className="h-[120px] w-full" />
    ))}
  </div>
);

// Error component
const AppraisalsError = ({ error }: { error: string }) => (
  <div className="rounded-md bg-destructive/15 p-4 text-destructive">
    <p>{error}</p>
  </div>
);

// Empty state component
const EmptyAppraisals = ({ searchTerm }: { searchTerm: string }) => (
  <div className="rounded-md border border-dashed p-8 text-center">
    <h3 className="text-lg font-medium">No appraisals found</h3>
    <p className="text-muted-foreground">
      {searchTerm 
        ? "Try adjusting your search" 
        : "You haven't claimed any appraisals yet"}
    </p>
    <Button asChild className="mt-4">
      <Link to="/agent/feed">Browse Available Appraisals</Link>
    </Button>
  </div>
);

// Appraisal card component
const AppraisalCard = ({ appraisal }: { appraisal: Appraisal }) => {
  // Format date safely, using created_at as fallback if updated_at doesn't exist
  const dateToFormat = appraisal.created_at;
  const formattedDate = dateToFormat ? format(new Date(dateToFormat), "MMM d, yyyy") : "Date not available";
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{appraisal.property_address}</CardTitle>
          <StatusBadge status={appraisal.status} />
        </div>
        <CardDescription>
          Claimed on {formattedDate}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        {appraisal.estimated_value_min && appraisal.estimated_value_max ? (
          <div className="text-lg font-semibold">
            ${appraisal.estimated_value_min.toLocaleString()} - ${appraisal.estimated_value_max.toLocaleString()}
          </div>
        ) : (
          <div className="text-muted-foreground">No value estimate available</div>
        )}
        {appraisal.property_details && (
          <div className="mt-2 text-sm text-muted-foreground">
            {appraisal.property_details.bedrooms && `${appraisal.property_details.bedrooms} beds • `}
            {appraisal.property_details.bathrooms && `${appraisal.property_details.bathrooms} baths • `}
            {appraisal.property_details.landSize && `${appraisal.property_details.landSize}m² land`}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link to={`/agent/appraisals/${appraisal.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

// Search input component
const SearchInput = ({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (value: string) => void 
}) => (
  <div className="relative">
    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
    <Input
      type="search"
      placeholder="Search by address..."
      className="pl-8"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

// Main component
export const AgentAppraisals = () => {
  const [appraisals, setAppraisals] = useState<Appraisal[]>([]);
  const [filteredAppraisals, setFilteredAppraisals] = useState<Appraisal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadAppraisals = async () => {
      try {
        setLoading(true);
        const data = await fetchAgentAppraisals();
        setAppraisals(data);
        setFilteredAppraisals(data);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load your appraisals";
        setError(errorMessage);
        console.error(err);
        toast({
          title: "Error",
          description: "Failed to load your appraisals. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadAppraisals();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = appraisals.filter(appraisal => 
        appraisal.property_address.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredAppraisals(filtered);
    } else {
      setFilteredAppraisals(appraisals);
    }
  }, [searchTerm, appraisals]);

  if (loading) {
    return <AppraisalsSkeleton />;
  }

  if (error) {
    return <AppraisalsError error={error} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Your Appraisals</h2>
        <SearchInput value={searchTerm} onChange={setSearchTerm} />
      </div>

      {filteredAppraisals.length === 0 ? (
        <EmptyAppraisals searchTerm={searchTerm} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAppraisals.map((appraisal) => (
            <AppraisalCard key={appraisal.id} appraisal={appraisal} />
          ))}
        </div>
      )}
    </div>
  );
}; 