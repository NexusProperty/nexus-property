import { useState, useEffect } from "react";
import { Appraisal } from "@/types/appraisal";
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
        setError("Failed to load your appraisals. Please try again later.");
        console.error(err);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "claimed":
        return <Badge variant="secondary">Claimed</Badge>;
      case "in_progress":
        return <Badge variant="outline">In Progress</Badge>;
      case "completed":
        return <Badge variant="default">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
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
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/15 p-4 text-destructive">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Your Appraisals</h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by address..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredAppraisals.length === 0 ? (
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
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAppraisals.map((appraisal) => (
            <Card key={appraisal.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{appraisal.property_address}</CardTitle>
                  {getStatusBadge(appraisal.status)}
                </div>
                <CardDescription>
                  Claimed on {format(new Date(appraisal.updated_at), "MMM d, yyyy")}
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
          ))}
        </div>
      )}
    </div>
  );
}; 