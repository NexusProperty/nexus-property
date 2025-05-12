import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

interface ConfirmationStepProps {
  formValues: {
    property_address: string;
    property_suburb: string;
    property_city: string;
    property_type: string;
    bedrooms: number | null;
    bathrooms: number | null;
    land_size: number | null;
    floor_area: number | null;
    year_built: number | null;
    features: string[] | null;
    comparable_radius: number;
    include_recent_sales: boolean;
    recent_sales_months: number;
    market_analysis_depth: "basic" | "standard" | "detailed";
    is_public: boolean;
  };
}

export function ConfirmationStep({ formValues }: ConfirmationStepProps) {
  // Helper function to format property type
  const formatPropertyType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Helper function to format market analysis depth
  const formatMarketAnalysisDepth = (depth: string) => {
    return depth.charAt(0).toUpperCase() + depth.slice(1);
  };

  return (
    <div className="space-y-6">
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Review Your Appraisal Request</AlertTitle>
        <AlertDescription>
          Please confirm that the details below are correct before submitting your appraisal request.
        </AlertDescription>
      </Alert>

      <div className="border rounded-md p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-3">Property Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Address</p>
              <p>{formValues.property_address}</p>
              <p>
                {formValues.property_suburb}, {formValues.property_city}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Property Type</p>
              <p>{formatPropertyType(formValues.property_type)}</p>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <h3 className="text-lg font-semibold mb-3">Property Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Bedrooms</p>
              <p>{formValues.bedrooms || "Not specified"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Bathrooms</p>
              <p>{formValues.bathrooms || "Not specified"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Land Size</p>
              <p>{formValues.land_size ? `${formValues.land_size} m²` : "Not specified"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Floor Area</p>
              <p>{formValues.floor_area ? `${formValues.floor_area} m²` : "Not specified"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Year Built</p>
              <p>{formValues.year_built || "Not specified"}</p>
            </div>
            <div className="md:col-span-3">
              <p className="text-sm font-medium text-muted-foreground">Features</p>
              {formValues.features && formValues.features.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-1">
                  {formValues.features.map((feature) => (
                    <span
                      key={feature}
                      className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              ) : (
                <p>No features specified</p>
              )}
            </div>
          </div>
        </div>

        <div className="pt-2">
          <h3 className="text-lg font-semibold mb-3">Appraisal Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Comparable Radius</p>
              <p>{formValues.comparable_radius} km</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Market Analysis Depth</p>
              <p>{formatMarketAnalysisDepth(formValues.market_analysis_depth)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Recent Sales</p>
              <p>
                {formValues.include_recent_sales
                  ? `Include sales from past ${formValues.recent_sales_months} months`
                  : "Do not include recent sales"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Visibility</p>
              <p>{formValues.is_public ? "Public" : "Private"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 