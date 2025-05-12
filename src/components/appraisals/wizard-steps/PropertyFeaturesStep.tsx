import { UseFormReturn } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusIcon, XIcon } from "lucide-react";

const appraisalFormSchema = z.object({
  bedrooms: z.number().min(0).optional().nullable(),
  bathrooms: z.number().min(0).optional().nullable(),
  land_size: z.number().min(0).optional().nullable(),
  floor_area: z.number().min(0).optional().nullable(),
  year_built: z.number().min(1800).max(new Date().getFullYear()).optional().nullable(),
  features: z.array(z.string()).optional().nullable(),
});

type AppraisalFormValues = z.infer<typeof appraisalFormSchema>;

interface PropertyFeaturesStepProps {
  form: UseFormReturn<any>;
}

export function PropertyFeaturesStep({ form }: PropertyFeaturesStepProps) {
  const [newFeature, setNewFeature] = useState("");

  // Common property features
  const commonFeatures = [
    "Garage",
    "Carport",
    "Swimming Pool",
    "Garden",
    "Deck",
    "Air Conditioning",
    "Central Heating",
    "Fireplace",
    "Ensuite",
    "Walk-in Closet",
    "Office",
  ];

  // Handle adding a custom feature
  const addFeature = () => {
    if (!newFeature.trim()) return;
    
    const currentFeatures = form.getValues("features") || [];
    if (!currentFeatures.includes(newFeature.trim())) {
      form.setValue("features", [...currentFeatures, newFeature.trim()]);
    }
    setNewFeature("");
  };

  // Handle removing a feature
  const removeFeature = (feature: string) => {
    const currentFeatures = form.getValues("features") || [];
    form.setValue(
      "features",
      currentFeatures.filter((f) => f !== feature)
    );
  };

  // Handle toggling a common feature
  const toggleCommonFeature = (feature: string) => {
    const currentFeatures = form.getValues("features") || [];
    if (currentFeatures.includes(feature)) {
      form.setValue(
        "features",
        currentFeatures.filter((f) => f !== feature)
      );
    } else {
      form.setValue("features", [...currentFeatures, feature]);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bedrooms */}
        <FormField
          control={form.control}
          name="bedrooms"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bedrooms</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Number of bedrooms"
                  min={0}
                  {...field}
                  onChange={(e) => {
                    const value = e.target.value ? parseInt(e.target.value, 10) : null;
                    field.onChange(value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Bathrooms */}
        <FormField
          control={form.control}
          name="bathrooms"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bathrooms</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Number of bathrooms"
                  min={0}
                  {...field}
                  onChange={(e) => {
                    const value = e.target.value ? parseInt(e.target.value, 10) : null;
                    field.onChange(value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Land Size */}
        <FormField
          control={form.control}
          name="land_size"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Land Size (m²)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Land size in square meters"
                  min={0}
                  {...field}
                  onChange={(e) => {
                    const value = e.target.value ? parseInt(e.target.value, 10) : null;
                    field.onChange(value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Floor Area */}
        <FormField
          control={form.control}
          name="floor_area"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Floor Area (m²)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Floor area in square meters"
                  min={0}
                  {...field}
                  onChange={(e) => {
                    const value = e.target.value ? parseInt(e.target.value, 10) : null;
                    field.onChange(value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Year Built */}
        <FormField
          control={form.control}
          name="year_built"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Year Built</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Year property was built"
                  min={1800}
                  max={new Date().getFullYear()}
                  {...field}
                  onChange={(e) => {
                    const value = e.target.value ? parseInt(e.target.value, 10) : null;
                    field.onChange(value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Property Features */}
      <div className="space-y-4">
        <FormLabel>Property Features</FormLabel>
        <FormDescription>
          Select features that apply to the property
        </FormDescription>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {commonFeatures.map((feature) => (
            <div key={feature} className="flex items-center space-x-2">
              <Checkbox
                id={`feature-${feature}`}
                checked={(form.getValues("features") || []).includes(feature)}
                onCheckedChange={() => toggleCommonFeature(feature)}
              />
              <label
                htmlFor={`feature-${feature}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {feature}
              </label>
            </div>
          ))}
        </div>

        {/* Custom Features */}
        <div className="mt-4">
          <FormLabel>Custom Features</FormLabel>
          <div className="flex items-center mt-1 space-x-2">
            <Input
              placeholder="Add another feature"
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addFeature();
                }
              }}
            />
            <Button type="button" onClick={addFeature} size="icon">
              <PlusIcon className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {(form.getValues("features") || []).map((feature) => (
              <Badge key={feature} variant="secondary" className="flex items-center gap-1">
                {feature}
                <XIcon
                  className="h-3 w-3 cursor-pointer hover:text-destructive"
                  onClick={() => removeFeature(feature)}
                />
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 