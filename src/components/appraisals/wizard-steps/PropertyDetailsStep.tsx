import { UseFormReturn } from "react-hook-form";
import { useEffect, useState } from "react";
import { getProperty } from "@/services/property";
import { useToast } from "@/components/ui/use-toast";
import { Database } from "@/types/supabase";
import { 
  AppraisalFormValues, 
  PropertyType, 
  validPropertyTypes 
} from "@/types/appraisal-schema";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

type Property = Database["public"]["Tables"]["properties"]["Row"];

interface PropertyDetailsStepProps {
  form: UseFormReturn<AppraisalFormValues>;
}

export function PropertyDetailsStep({ form }: PropertyDetailsStepProps) {
  const { toast } = useToast();
  const [isLoadingProperty, setIsLoadingProperty] = useState(false);
  const [loadedProperty, setLoadedProperty] = useState<Property | null>(null);
  
  const propertyId = form.getValues("property_id");

  // Helper function to ensure property type is valid
  const ensureValidPropertyType = (type: string): PropertyType => {
    if (validPropertyTypes.includes(type as PropertyType)) {
      return type as PropertyType;
    }
    return 'house'; // Default fallback
  };

  // Load property data if propertyId is provided
  useEffect(() => {
    if (!propertyId) return;

    const loadProperty = async () => {
      setIsLoadingProperty(true);
      try {
        const result = await getProperty(propertyId);
        if (result.success && result.data) {
          setLoadedProperty(result.data);
          
          // Pre-fill form with property data
          form.setValue("property_address", result.data.address);
          form.setValue("property_suburb", result.data.suburb);
          form.setValue("property_city", result.data.city);
          form.setValue("property_postcode", result.data.postcode || "");
          
          // Ensure property type is valid
          const validType = ensureValidPropertyType(result.data.property_type);
          form.setValue("property_type", validType);
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to load property data",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error loading property:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setIsLoadingProperty(false);
      }
    };

    loadProperty();
  }, [propertyId, form, toast]);

  if (isLoadingProperty) {
    return (
      <div className="flex justify-center items-center p-6">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {loadedProperty && (
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Using Property Data</AlertTitle>
          <AlertDescription>
            This appraisal will be linked to your property at {loadedProperty.address}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Property Address */}
        <div className="md:col-span-2">
          <FormField
            control={form.control}
            name="property_address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Property Address</FormLabel>
                <FormControl>
                  <Input placeholder="123 Main Street" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Suburb */}
        <FormField
          control={form.control}
          name="property_suburb"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Suburb</FormLabel>
              <FormControl>
                <Input placeholder="Suburb" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* City */}
        <FormField
          control={form.control}
          name="property_city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City</FormLabel>
              <FormControl>
                <Input placeholder="City" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Postcode */}
        <FormField
          control={form.control}
          name="property_postcode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Postcode</FormLabel>
              <FormControl>
                <Input placeholder="Postcode" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Property Type */}
        <FormField
          control={form.control}
          name="property_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Property Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="townhouse">Townhouse</SelectItem>
                  <SelectItem value="land">Land</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
} 