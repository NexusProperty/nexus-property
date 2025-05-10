import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Appraisal, AppraisalStatus } from "@/types/appraisal";
import { fetchAppraisalById } from "@/services/appraisalService";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ArrowLeft, Download, ExternalLink, FileText, Home, MapPin, Share2, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";

// Status badge component
const StatusBadge = ({ status }: { status: AppraisalStatus }) => {
  const statusConfig = {
    draft: { label: "Draft", variant: "outline" as const },
    processing: { label: "Processing", variant: "secondary" as const },
    published: { label: "Published", variant: "default" as const },
    claimed: { label: "Claimed", variant: "secondary" as const },
    completed: { label: "Completed", variant: "default" as const },
    cancelled: { label: "Cancelled", variant: "destructive" as const }
  };

  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

// Loading skeleton component
const AppraisalDetailSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-2">
      <Skeleton className="h-6 w-6" />
      <Skeleton className="h-6 w-32" />
    </div>
    <Skeleton className="h-10 w-full" />
    <div className="grid gap-6 md:grid-cols-3">
      <Skeleton className="h-[200px] w-full" />
      <Skeleton className="h-[200px] w-full md:col-span-2" />
    </div>
    <Skeleton className="h-[300px] w-full" />
  </div>
);

// Error component
const AppraisalError = ({ error, onBack }: { error: string; onBack: () => void }) => (
  <div className="rounded-md bg-destructive/15 p-4 text-destructive">
    <p>{error}</p>
    <Button 
      variant="outline" 
      className="mt-4" 
      onClick={onBack}
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      Go Back
    </Button>
  </div>
);

// Property details component
const PropertyDetails = ({ propertyDetails }: { propertyDetails: Appraisal['property_details'] }) => {
  if (!propertyDetails) {
    return <div className="text-muted-foreground">No property details available</div>;
  }

  return (
    <div className="space-y-2">
      {propertyDetails.bedrooms && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Bedrooms</span>
          <span>{propertyDetails.bedrooms}</span>
        </div>
      )}
      {propertyDetails.bathrooms && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Bathrooms</span>
          <span>{propertyDetails.bathrooms}</span>
        </div>
      )}
      {propertyDetails.landSize && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Land Size</span>
          <span>{propertyDetails.landSize}m²</span>
        </div>
      )}
      {propertyDetails.buildingSize && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Building Size</span>
          <span>{propertyDetails.buildingSize}m²</span>
        </div>
      )}
      {propertyDetails.yearBuilt && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Year Built</span>
          <span>{propertyDetails.yearBuilt}</span>
        </div>
      )}
      {propertyDetails.propertyType && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Property Type</span>
          <span>{propertyDetails.propertyType}</span>
        </div>
      )}
    </div>
  );
};

// Estimated value component
const EstimatedValue = ({ min, max }: { min?: number; max?: number }) => {
  if (!min || !max) {
    return <div className="text-muted-foreground">No value estimate available yet</div>;
  }

  return (
    <div className="space-y-4">
      <div className="text-3xl font-bold">
        ${min.toLocaleString()} - ${max.toLocaleString()}
      </div>
      <div className="text-muted-foreground">
        This is an estimated value range based on comparable properties and market analysis.
      </div>
    </div>
  );
};

// Property features component
const PropertyFeatures = ({ features }: { features?: string[] }) => {
  if (!features?.length) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Property Features</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {features.map((feature, index) => (
            <Badge key={index} variant="secondary">{feature}</Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Customer information component
const CustomerInformation = ({ customerId }: { customerId?: string }) => {
  if (!customerId) {
    return <div className="text-muted-foreground">No customer information available</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div>
          <div className="font-medium">Customer ID: {customerId}</div>
          <div className="text-sm text-muted-foreground">Contact information available in CRM</div>
        </div>
      </div>
      
      <Separator />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-muted-foreground">Contact Method</div>
          <div>Email or Phone</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Status</div>
          <div>Active Lead</div>
        </div>
      </div>
    </div>
  );
};

// Comparable property card component
const ComparablePropertyCard = ({ property }: { property: Appraisal['comparable_properties'][0] }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-lg">{property.address}</CardTitle>
      <CardDescription>
        Sold on {format(new Date(property.saleDate), "MMM d, yyyy")}
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="text-xl font-semibold mb-2">
        ${property.salePrice.toLocaleString()}
      </div>
      <div className="space-y-1 text-sm text-muted-foreground">
        {property.bedrooms && <div>{property.bedrooms} beds</div>}
        {property.bathrooms && <div>{property.bathrooms} baths</div>}
        {property.landSize && <div>{property.landSize}m² land</div>}
        {property.buildingSize && <div>{property.buildingSize}m² building</div>}
        {property.yearBuilt && <div>Built {property.yearBuilt}</div>}
        {property.distanceFromSubject && (
          <div>{property.distanceFromSubject}km from subject property</div>
        )}
      </div>
    </CardContent>
  </Card>
);

// Market analysis component
const MarketAnalysis = ({ marketAnalysis }: { marketAnalysis?: Appraisal['market_analysis'] }) => {
  if (!marketAnalysis) {
    return (
      <div className="rounded-md border border-dashed p-8 text-center">
        <h3 className="text-lg font-medium">No market analysis</h3>
        <p className="text-muted-foreground">
          Market analysis data is not available for this appraisal.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Market Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {marketAnalysis.medianPrice && (
              <div>
                <div className="text-sm text-muted-foreground">Median Price</div>
                <div className="text-xl font-semibold">
                  ${marketAnalysis.medianPrice.toLocaleString()}
                </div>
              </div>
            )}
            {marketAnalysis.priceChange3Months !== undefined && (
              <div>
                <div className="text-sm text-muted-foreground">3-Month Change</div>
                <div className={`text-xl font-semibold ${
                  marketAnalysis.priceChange3Months > 0 
                    ? "text-green-600" 
                    : marketAnalysis.priceChange3Months < 0 
                      ? "text-red-600" 
                      : ""
                }`}>
                  {marketAnalysis.priceChange3Months > 0 ? "+" : ""}
                  {marketAnalysis.priceChange3Months}%
                </div>
              </div>
            )}
            {marketAnalysis.priceChange12Months !== undefined && (
              <div>
                <div className="text-sm text-muted-foreground">12-Month Change</div>
                <div className={`text-xl font-semibold ${
                  marketAnalysis.priceChange12Months > 0 
                    ? "text-green-600" 
                    : marketAnalysis.priceChange12Months < 0 
                      ? "text-red-600" 
                      : ""
                }`}>
                  {marketAnalysis.priceChange12Months > 0 ? "+" : ""}
                  {marketAnalysis.priceChange12Months}%
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Market Conditions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {marketAnalysis.averageDaysOnMarket !== undefined && (
              <div>
                <div className="text-sm text-muted-foreground">Average Days on Market</div>
                <div className="text-xl font-semibold">
                  {marketAnalysis.averageDaysOnMarket} days
                </div>
              </div>
            )}
            {marketAnalysis.localMarketTrend && (
              <div>
                <div className="text-sm text-muted-foreground">Market Trend</div>
                <div className="text-xl font-semibold">
                  {marketAnalysis.localMarketTrend}
                </div>
              </div>
            )}
            {marketAnalysis.demandLevel && (
              <div>
                <div className="text-sm text-muted-foreground">Demand Level</div>
                <div className="text-xl font-semibold">
                  {marketAnalysis.demandLevel}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Main component
export const AgentAppraisalDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [appraisal, setAppraisal] = useState<Appraisal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAppraisal = async () => {
      if (!id) {
        setError("Appraisal ID is missing");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const data = await fetchAppraisalById(id);
        if (data) {
          setAppraisal(data);
          setError(null);
        } else {
          setError("Appraisal not found");
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load appraisal details";
        setError(errorMessage);
        console.error(err);
        toast({
          title: "Error",
          description: "Failed to load appraisal details. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadAppraisal();
  }, [id]);

  const handleGoBack = () => navigate(-1);

  if (loading) {
    return <AppraisalDetailSkeleton />;
  }

  if (error || !appraisal) {
    return <AppraisalError error={error || "Appraisal not found"} onBack={handleGoBack} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleGoBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Appraisal Details</h1>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">{appraisal.property_address}</h2>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={appraisal.status} />
            <span className="text-sm text-muted-foreground">
              Created on {format(new Date(appraisal.created_at), "MMMM d, yyyy")}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {appraisal.report_url && (
            <Button variant="outline" asChild>
              <a href={appraisal.report_url} target="_blank" rel="noopener noreferrer">
                <FileText className="mr-2 h-4 w-4" />
                View Report
              </a>
            </Button>
          )}
          <Button variant="outline">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="customer">Customer</TabsTrigger>
          <TabsTrigger value="comparables">Comparables</TabsTrigger>
          <TabsTrigger value="market">Market Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Property Details</CardTitle>
              </CardHeader>
              <CardContent>
                <PropertyDetails propertyDetails={appraisal.property_details} />
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Estimated Value</CardTitle>
              </CardHeader>
              <CardContent>
                <EstimatedValue 
                  min={appraisal.estimated_value_min} 
                  max={appraisal.estimated_value_max} 
                />
              </CardContent>
            </Card>
          </div>
          
          <PropertyFeatures features={appraisal.property_details?.features} />
        </TabsContent>
        
        <TabsContent value="customer" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Customer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <CustomerInformation customerId={appraisal.customer_id} />
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                <ExternalLink className="mr-2 h-4 w-4" />
                Contact Customer
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="comparables" className="space-y-4">
          {appraisal.comparable_properties?.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {appraisal.comparable_properties.map((property, index) => (
                <ComparablePropertyCard key={index} property={property} />
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed p-8 text-center">
              <h3 className="text-lg font-medium">No comparable properties</h3>
              <p className="text-muted-foreground">
                Comparable property data is not available for this appraisal.
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="market" className="space-y-4">
          <MarketAnalysis marketAnalysis={appraisal.market_analysis} />
        </TabsContent>
      </Tabs>
    </div>
  );
}; 