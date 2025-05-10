import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Appraisal } from "@/types/appraisal";
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

export const AgentAppraisalDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [appraisal, setAppraisal] = useState<Appraisal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAppraisal = async () => {
      if (!id) return;
      
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
        setError("Failed to load appraisal details. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadAppraisal();
  }, [id]);

  const getStatusBadge = (status: Appraisal["status"]) => {
    const statusConfig = {
      draft: { label: "Draft", variant: "outline" as const },
      processing: { label: "Processing", variant: "secondary" as const },
      completed: { label: "Completed", variant: "default" as const },
      published: { label: "Published", variant: "default" as const },
      claimed: { label: "Claimed", variant: "secondary" as const }
    };

    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
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
  }

  if (error || !appraisal) {
    return (
      <div className="rounded-md bg-destructive/15 p-4 text-destructive">
        <p>{error || "Appraisal not found"}</p>
        <Button 
          variant="outline" 
          className="mt-4" 
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Appraisal Details</h1>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">{appraisal.property_address}</h2>
          <div className="flex items-center gap-2 mt-1">
            {getStatusBadge(appraisal.status)}
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
                {appraisal.property_details ? (
                  <div className="space-y-2">
                    {appraisal.property_details.bedrooms && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bedrooms</span>
                        <span>{appraisal.property_details.bedrooms}</span>
                      </div>
                    )}
                    {appraisal.property_details.bathrooms && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bathrooms</span>
                        <span>{appraisal.property_details.bathrooms}</span>
                      </div>
                    )}
                    {appraisal.property_details.landSize && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Land Size</span>
                        <span>{appraisal.property_details.landSize}m²</span>
                      </div>
                    )}
                    {appraisal.property_details.buildingSize && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Building Size</span>
                        <span>{appraisal.property_details.buildingSize}m²</span>
                      </div>
                    )}
                    {appraisal.property_details.yearBuilt && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Year Built</span>
                        <span>{appraisal.property_details.yearBuilt}</span>
                      </div>
                    )}
                    {appraisal.property_details.propertyType && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Property Type</span>
                        <span>{appraisal.property_details.propertyType}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-muted-foreground">No property details available</div>
                )}
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Estimated Value</CardTitle>
              </CardHeader>
              <CardContent>
                {appraisal.estimated_value_min && appraisal.estimated_value_max ? (
                  <div className="space-y-4">
                    <div className="text-3xl font-bold">
                      ${appraisal.estimated_value_min.toLocaleString()} - ${appraisal.estimated_value_max.toLocaleString()}
                    </div>
                    <div className="text-muted-foreground">
                      This is an estimated value range based on comparable properties and market analysis.
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground">No value estimate available yet</div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {appraisal.property_details?.features && appraisal.property_details.features.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Property Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {appraisal.property_details.features.map((feature, index) => (
                    <Badge key={index} variant="secondary">{feature}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="customer" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Customer Information</CardTitle>
            </CardHeader>
            <CardContent>
              {appraisal.customer_id ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">Customer ID: {appraisal.customer_id}</div>
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
              ) : (
                <div className="text-muted-foreground">No customer information available</div>
              )}
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
          {appraisal.comparable_properties && appraisal.comparable_properties.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {appraisal.comparable_properties.map((property, index) => (
                <Card key={index}>
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
          {appraisal.market_analysis ? (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Market Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {appraisal.market_analysis.medianPrice && (
                      <div>
                        <div className="text-sm text-muted-foreground">Median Price</div>
                        <div className="text-xl font-semibold">
                          ${appraisal.market_analysis.medianPrice.toLocaleString()}
                        </div>
                      </div>
                    )}
                    {appraisal.market_analysis.priceChange3Months !== undefined && (
                      <div>
                        <div className="text-sm text-muted-foreground">3-Month Change</div>
                        <div className={`text-xl font-semibold ${
                          appraisal.market_analysis.priceChange3Months > 0 
                            ? "text-green-600" 
                            : appraisal.market_analysis.priceChange3Months < 0 
                              ? "text-red-600" 
                              : ""
                        }`}>
                          {appraisal.market_analysis.priceChange3Months > 0 ? "+" : ""}
                          {appraisal.market_analysis.priceChange3Months}%
                        </div>
                      </div>
                    )}
                    {appraisal.market_analysis.priceChange12Months !== undefined && (
                      <div>
                        <div className="text-sm text-muted-foreground">12-Month Change</div>
                        <div className={`text-xl font-semibold ${
                          appraisal.market_analysis.priceChange12Months > 0 
                            ? "text-green-600" 
                            : appraisal.market_analysis.priceChange12Months < 0 
                              ? "text-red-600" 
                              : ""
                        }`}>
                          {appraisal.market_analysis.priceChange12Months > 0 ? "+" : ""}
                          {appraisal.market_analysis.priceChange12Months}%
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
                    {appraisal.market_analysis.averageDaysOnMarket !== undefined && (
                      <div>
                        <div className="text-sm text-muted-foreground">Average Days on Market</div>
                        <div className="text-xl font-semibold">
                          {appraisal.market_analysis.averageDaysOnMarket} days
                        </div>
                      </div>
                    )}
                    {appraisal.market_analysis.localMarketTrend && (
                      <div>
                        <div className="text-sm text-muted-foreground">Market Trend</div>
                        <div className="text-xl font-semibold">
                          {appraisal.market_analysis.localMarketTrend}
                        </div>
                      </div>
                    )}
                    {appraisal.market_analysis.demandLevel && (
                      <div>
                        <div className="text-sm text-muted-foreground">Demand Level</div>
                        <div className="text-xl font-semibold">
                          {appraisal.market_analysis.demandLevel}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="rounded-md border border-dashed p-8 text-center">
              <h3 className="text-lg font-medium">No market analysis</h3>
              <p className="text-muted-foreground">
                Market analysis data is not available for this appraisal.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}; 