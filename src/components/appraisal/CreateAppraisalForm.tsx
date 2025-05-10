import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm, Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createAppraisal } from "@/services/appraisalService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

// Define the form schema
const formSchema = z.object({
  property_address: z.string().min(1, "Property address is required"),
  bedrooms: z.coerce.number().min(0, "Bedrooms must be a positive number").optional(),
  bathrooms: z.coerce.number().min(0, "Bathrooms must be a positive number").optional(),
  square_footage: z.coerce.number().min(0, "Square footage must be a positive number").optional(),
  property_type: z.string().optional(),
  year_built: z.coerce.number().min(1800, "Year built must be after 1800").max(new Date().getFullYear(), "Year built cannot be in the future").optional(),
  lot_size: z.coerce.number().min(0, "Lot size must be a positive number").optional(),
  features: z.array(z.string()).optional(),
  additional_features: z.string().optional(),
  condition: z.string().optional(),
  renovation_history: z.string().optional(),
  additional_notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Property address field component
const PropertyAddressField = ({ control }: { control: Control<FormValues> }) => (
  <FormField
    control={control}
    name="property_address"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Property Address</FormLabel>
        <FormControl>
          <Input placeholder="123 Main St, City, State, ZIP" {...field} />
        </FormControl>
        <FormDescription>
          Enter the full address of the property you want appraised.
        </FormDescription>
        <FormMessage />
      </FormItem>
    )}
  />
);

// Property details grid component
const PropertyDetailsGrid = ({ control }: { control: Control<FormValues> }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <FormField
      control={control}
      name="bedrooms"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Bedrooms</FormLabel>
          <FormControl>
            <Input type="number" min="0" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    
    <FormField
      control={control}
      name="bathrooms"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Bathrooms</FormLabel>
          <FormControl>
            <Input type="number" min="0" step="0.5" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    
    <FormField
      control={control}
      name="square_footage"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Square Footage</FormLabel>
          <FormControl>
            <Input type="number" min="0" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    
    <FormField
      control={control}
      name="property_type"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Property Type</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select property type" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="single_family">Single Family</SelectItem>
              <SelectItem value="multi_family">Multi Family</SelectItem>
              <SelectItem value="condo">Condo</SelectItem>
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
    
    <FormField
      control={control}
      name="year_built"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Year Built</FormLabel>
          <FormControl>
            <Input type="number" min="1800" max={new Date().getFullYear()} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    
    <FormField
      control={control}
      name="lot_size"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Lot Size (sq ft)</FormLabel>
          <FormControl>
            <Input type="number" min="0" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </div>
);

// Property condition field component
const PropertyConditionField = ({ control }: { control: Control<FormValues> }) => (
  <FormField
    control={control}
    name="condition"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Property Condition</FormLabel>
        <Select onValueChange={field.onChange} defaultValue={field.value}>
          <FormControl>
            <SelectTrigger>
              <SelectValue placeholder="Select property condition" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            <SelectItem value="excellent">Excellent</SelectItem>
            <SelectItem value="good">Good</SelectItem>
            <SelectItem value="fair">Fair</SelectItem>
            <SelectItem value="poor">Poor</SelectItem>
            <SelectItem value="needs_renovation">Needs Renovation</SelectItem>
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>
    )}
  />
);

// Property features component
const PropertyFeaturesField = ({ control }: { control: Control<FormValues> }) => {
  const features = [
    "Garage", "Pool", "Fireplace", "Basement", "Deck", 
    "Patio", "Garden", "Central Air", "Hardwood Floors", "Updated Kitchen"
  ];
  
  return (
    <FormField
      control={control}
      name="features"
      render={() => (
        <FormItem>
          <div className="mb-4">
            <FormLabel>Property Features</FormLabel>
            <FormDescription>
              Select all features that apply to the property.
            </FormDescription>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {features.map((feature) => (
              <FormField
                key={feature}
                control={control}
                name="features"
                render={({ field }) => {
                  const featureValue = feature.toLowerCase().replace(/\s+/g, '_');
                  return (
                    <FormItem
                      key={feature}
                      className="flex flex-row items-start space-x-3 space-y-0"
                    >
                      <FormControl>
                        <Checkbox
                          checked={field.value?.includes(featureValue)}
                          onCheckedChange={(checked) => {
                            return checked
                              ? field.onChange([...(field.value || []), featureValue])
                              : field.onChange(
                                  field.value?.filter(
                                    (value) => value !== featureValue
                                  )
                                );
                          }}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        {feature}
                      </FormLabel>
                    </FormItem>
                  );
                }}
              />
            ))}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

// Additional information fields component
const AdditionalInformationFields = ({ control }: { control: Control<FormValues> }) => (
  <>
    <FormField
      control={control}
      name="additional_features"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Additional Features</FormLabel>
          <FormControl>
            <Textarea
              placeholder="Describe any other features or amenities not listed above"
              className="resize-none"
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    
    <FormField
      control={control}
      name="renovation_history"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Renovation History</FormLabel>
          <FormControl>
            <Textarea
              placeholder="Describe any recent renovations or improvements made to the property"
              className="resize-none"
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    
    <FormField
      control={control}
      name="additional_notes"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Additional Notes</FormLabel>
          <FormControl>
            <Textarea
              placeholder="Any other information you'd like to provide about the property"
              className="resize-none"
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </>
);

// Form actions component
const FormActions = ({ isSubmitting, onCancel }: { isSubmitting: boolean; onCancel: () => void }) => (
  <div className="flex justify-end space-x-4">
    <Button
      type="button"
      variant="outline"
      onClick={onCancel}
      disabled={isSubmitting}
    >
      Cancel
    </Button>
    <Button type="submit" disabled={isSubmitting}>
      {isSubmitting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Submitting...
        </>
      ) : (
        "Submit Appraisal Request"
      )}
    </Button>
  </div>
);

export function CreateAppraisalForm() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      property_address: "",
      bedrooms: undefined,
      bathrooms: undefined,
      square_footage: undefined,
      property_type: undefined,
      year_built: undefined,
      lot_size: undefined,
      features: [],
      additional_features: "",
      condition: undefined,
      renovation_history: "",
      additional_notes: "",
    },
  });
  
  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    
    try {
      // Extract property details from form values
      const { property_address, additional_notes, ...propertyDetails } = values;
      
      // Create the appraisal
      const appraisal = await createAppraisal(
        property_address,
        propertyDetails,
        additional_notes
      );
      
      if (appraisal) {
        toast({
          title: "Appraisal Request Submitted",
          description: "Your appraisal request has been successfully submitted.",
        });
        
        // Navigate to the appraisal detail page
        navigate(`/appraisals/${appraisal.id}`);
      }
    } catch (error) {
      console.error("Error creating appraisal:", error);
      toast({
        title: "Error",
        description: "There was a problem submitting your appraisal request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancel = () => navigate(-1);
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Appraisal</CardTitle>
        <CardDescription>
          Fill out the form below to request a property appraisal. The more details you provide, the more accurate the appraisal will be.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <PropertyAddressField control={form.control} />
            <PropertyDetailsGrid control={form.control} />
            <PropertyConditionField control={form.control} />
            <PropertyFeaturesField control={form.control} />
            <AdditionalInformationFields control={form.control} />
            <FormActions isSubmitting={isSubmitting} onCancel={handleCancel} />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 