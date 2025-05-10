import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { fetchAndStandardizePropertyData, StandardizedPropertyData } from "@/services/dataIngestionService";
import { toast } from "@/components/ui/use-toast";

export function PropertyDataDemo() {
  const [address, setAddress] = useState<string>("");
  const [suburb, setSuburb] = useState<string>("");
  const [region, setRegion] = useState<string>("Auckland");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [propertyData, setPropertyData] = useState<StandardizedPropertyData | null>(null);

  const handleFetchData = async () => {
    if (!address || !suburb) {
      setError("Please enter both address and suburb.");
      toast({
        title: "Missing information",
        description: "Please enter both address and suburb.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAndStandardizePropertyData(address, suburb, region);
      setPropertyData(data);
      toast({
        title: "Data fetched successfully",
        description: "Property data has been fetched and standardized.",
      });
    } catch (error) {
      console.error("Error fetching property data:", error);
      setError("An error occurred while fetching property data. Please try again.");
      toast({
        title: "Error fetching property data",
        description: "An error occurred while fetching property data.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Property Data Ingestion Demo</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Enter Property Details</CardTitle>
          <CardDescription>
            Enter a property address to fetch data from CoreLogic and REINZ.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label htmlFor="address" className="text-sm font-medium">
                Address
              </label>
              <Input
                id="address"
                placeholder="123 Example Street"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="suburb" className="text-sm font-medium">
                Suburb
              </label>
              <Input
                id="suburb"
                placeholder="Example Suburb"
                value={suburb}
                onChange={(e) => setSuburb(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="region" className="text-sm font-medium">
                Region
              </label>
              <Input
                id="region"
                placeholder="Auckland"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleFetchData} disabled={isLoading}>
            {isLoading ? "Fetching..." : "Fetch Property Data"}
          </Button>
        </CardFooter>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-8">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {propertyData && !isLoading && !error && (
        <Tabs defaultValue="property" className="w-full">
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="property">Property</TabsTrigger>
            <TabsTrigger value="valuation">Valuation</TabsTrigger>
            <TabsTrigger value="market">Market</TabsTrigger>
            <TabsTrigger value="sales">Sales History</TabsTrigger>
            <TabsTrigger value="comparables">Comparables</TabsTrigger>
          </TabsList>
          
          <TabsContent value="property">
            <Card>
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
                <CardDescription>
                  Basic information about the property.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium">Address</h3>
                    <p>{propertyData.property.address}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Location</h3>
                    <p>{propertyData.property.suburb}, {propertyData.property.city}, {propertyData.property.postcode}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Property Type</h3>
                    <p>{propertyData.property.propertyType}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Bedrooms & Bathrooms</h3>
                    <p>{propertyData.property.bedrooms} bedrooms, {propertyData.property.bathrooms} bathrooms</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Land & Floor Area</h3>
                    <p>{propertyData.property.landArea} m² land, {propertyData.property.floorArea} m² floor</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Year Built</h3>
                    <p>{propertyData.property.yearBuilt || "Unknown"}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Title</h3>
                    <p>{propertyData.property.title}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Zoning</h3>
                    <p>{propertyData.property.zoning}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Council</h3>
                    <p>{propertyData.property.council}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Last Sale</h3>
                    <p>
                      {propertyData.property.lastSaleDate ? (
                        <>
                          {propertyData.property.lastSaleDate} for ${propertyData.property.lastSalePrice?.toLocaleString()}
                        </>
                      ) : (
                        "No sale history available"
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="valuation">
            <Card>
              <CardHeader>
                <CardTitle>Valuation Data</CardTitle>
                <CardDescription>
                  Automated valuation model (AVM) data from CoreLogic.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium">Estimated Value</h3>
                    <p className="text-2xl font-bold">${propertyData.valuation.estimatedValue.toLocaleString()}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Confidence Score</h3>
                    <p>{propertyData.valuation.confidenceScore}%</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Value Range</h3>
                    <p>${propertyData.valuation.valueRange.min.toLocaleString()} - ${propertyData.valuation.valueRange.max.toLocaleString()}</p>
                  </div>
                  <div>
                    <h3 className="font-medium">Last Updated</h3>
                    <p>{propertyData.valuation.lastUpdated}</p>
                  </div>
                  <div className="md:col-span-2">
                    <h3 className="font-medium">Methodology</h3>
                    <p>{propertyData.valuation.methodology}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="market">
            <Card>
              <CardHeader>
                <CardTitle>Market Data</CardTitle>
                <CardDescription>
                  Local market statistics from CoreLogic and REINZ.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium">Suburb Median Price</h3>
                    <p className="text-xl">${propertyData.marketData.suburbMedianPrice.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">
                      {propertyData.marketData.suburbMedianPriceChange > 0 ? "+" : ""}
                      {propertyData.marketData.suburbMedianPriceChange}% over {propertyData.marketData.suburbMedianPriceChangePeriod}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium">Sales Volume</h3>
                    <p className="text-xl">{propertyData.marketData.suburbSalesVolume} properties</p>
                    <p className="text-sm text-muted-foreground">
                      {propertyData.marketData.suburbSalesVolumeChange > 0 ? "+" : ""}
                      {propertyData.marketData.suburbSalesVolumeChange}% change
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium">Days on Market</h3>
                    <p className="text-xl">{propertyData.marketData.suburbDaysOnMarket} days</p>
                    <p className="text-sm text-muted-foreground">
                      {propertyData.marketData.suburbDaysOnMarketChange > 0 ? "+" : ""}
                      {propertyData.marketData.suburbDaysOnMarketChange} days change
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium">Active Listings</h3>
                    <p className="text-xl">{propertyData.marketData.suburbActiveListings} properties</p>
                    <p className="text-sm text-muted-foreground">
                      {propertyData.marketData.suburbActiveListingsChange > 0 ? "+" : ""}
                      {propertyData.marketData.suburbActiveListingsChange} properties change
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium">Auction Clearance Rate</h3>
                    <p className="text-xl">{propertyData.marketData.suburbAuctionClearanceRate}%</p>
                    <p className="text-sm text-muted-foreground">
                      {propertyData.marketData.suburbAuctionClearanceRateChange > 0 ? "+" : ""}
                      {propertyData.marketData.suburbAuctionClearanceRateChange}% change
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="sales">
            <Card>
              <CardHeader>
                <CardTitle>Sales History</CardTitle>
                <CardDescription>
                  Historical sales data for the property.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {propertyData.salesHistory.sales.length > 0 ? (
                  <div className="space-y-4">
                    {propertyData.salesHistory.sales.map((sale, index) => (
                      <div key={index} className="border-b pb-4 last:border-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h3 className="font-medium">Sale Date</h3>
                            <p>{sale.date}</p>
                          </div>
                          <div>
                            <h3 className="font-medium">Sale Price</h3>
                            <p className="text-xl">${sale.price.toLocaleString()}</p>
                          </div>
                          <div>
                            <h3 className="font-medium">Sale Type</h3>
                            <p>{sale.type}</p>
                          </div>
                          <div>
                            <h3 className="font-medium">Source</h3>
                            <p>{sale.source}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No sales history available for this property.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="comparables">
            <Card>
              <CardHeader>
                <CardTitle>Comparable Properties</CardTitle>
                <CardDescription>
                  Similar properties in the area for comparison.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-2">Subject Property</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Address</p>
                        <p>{propertyData.comparables.subjectProperty.address}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p>{propertyData.comparables.subjectProperty.suburb}, {propertyData.comparables.subjectProperty.city}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Property Type</p>
                        <p>{propertyData.comparables.subjectProperty.propertyType}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Bedrooms & Bathrooms</p>
                        <p>{propertyData.comparables.subjectProperty.bedrooms} bedrooms, {propertyData.comparables.subjectProperty.bathrooms} bathrooms</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Land & Floor Area</p>
                        <p>{propertyData.comparables.subjectProperty.landArea} m² land, {propertyData.comparables.subjectProperty.floorArea} m² floor</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Comparable Properties</h3>
                    <div className="space-y-4">
                      {propertyData.comparables.comparables.map((comparable, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Address</p>
                              <p>{comparable.address}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Location</p>
                              <p>{comparable.suburb}, {comparable.city}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Property Type</p>
                              <p>{comparable.propertyType}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Bedrooms & Bathrooms</p>
                              <p>{comparable.bedrooms} bedrooms, {comparable.bathrooms} bathrooms</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Land & Floor Area</p>
                              <p>{comparable.landArea} m² land, {comparable.floorArea} m² floor</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Sale Price</p>
                              <p className="text-xl">${comparable.salePrice.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Sale Date</p>
                              <p>{comparable.saleDate}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Sale Type</p>
                              <p>{comparable.saleType}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Distance</p>
                              <p>{comparable.distance} km</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Similarity Score</p>
                              <p>{comparable.similarityScore}%</p>
                            </div>
                            <div className="md:col-span-2">
                              <p className="text-sm text-muted-foreground">Features</p>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {comparable.features.map((feature, featureIndex) => (
                                  <span key={featureIndex} className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm">
                                    {feature}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
} 