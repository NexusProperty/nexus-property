import { UseFormReturn } from "react-hook-form";
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
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const appraisalFormSchema = z.object({
  comparable_radius: z.number().min(1).max(20).default(5),
  include_recent_sales: z.boolean().default(true),
  recent_sales_months: z.number().min(1).max(36).default(12),
  market_analysis_depth: z.enum(["basic", "standard", "detailed"]).default("standard"),
  is_public: z.boolean().default(false),
});

type AppraisalFormValues = z.infer<typeof appraisalFormSchema>;

interface AppraisalParametersStepProps {
  form: UseFormReturn<any>;
}

export function AppraisalParametersStep({ form }: AppraisalParametersStepProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Comparable Properties Radius */}
        <FormField
          control={form.control}
          name="comparable_radius"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comparable Properties Radius (km)</FormLabel>
              <FormDescription>
                Maximum distance from the subject property
              </FormDescription>
              <FormControl>
                <div className="space-y-3">
                  <Slider
                    min={1}
                    max={20}
                    step={1}
                    value={[field.value || 5]}
                    onValueChange={(values) => field.onChange(values[0])}
                  />
                  <div className="flex justify-between">
                    <span className="text-xs">1 km</span>
                    <span className="text-xs font-medium">{field.value || 5} km</span>
                    <span className="text-xs">20 km</span>
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Recent Sales Period */}
        <FormField
          control={form.control}
          name="recent_sales_months"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Recent Sales Period (months)</FormLabel>
              <FormDescription>
                Consider sales from the past X months
              </FormDescription>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={36}
                  placeholder="12"
                  {...field}
                  onChange={(e) => {
                    const value = e.target.value
                      ? parseInt(e.target.value, 10)
                      : 12;
                    field.onChange(value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Include Recent Sales */}
        <FormField
          control={form.control}
          name="include_recent_sales"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Include Recent Sales</FormLabel>
                <FormDescription>
                  Include recent property sales in the analysis
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        {/* Make Appraisal Public */}
        <FormField
          control={form.control}
          name="is_public"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Make Appraisal Public</FormLabel>
                <FormDescription>
                  Allow other users to view this appraisal
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
      </div>

      {/* Market Analysis Depth */}
      <FormField
        control={form.control}
        name="market_analysis_depth"
        render={({ field }) => (
          <FormItem className="space-y-4">
            <FormLabel>Market Analysis Depth</FormLabel>
            <FormDescription>
              Choose how detailed you want the market analysis to be
            </FormDescription>
            <FormControl>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className={`cursor-pointer hover:border-primary transition-colors ${field.value === "basic" ? "border-primary bg-primary/5" : ""}`}
                  onClick={() => field.onChange("basic")}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Basic</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription>
                      <ul className="list-disc list-inside text-xs space-y-1">
                        <li>Essential property valuation</li>
                        <li>Limited market trends</li>
                        <li>Up to 3 comparable properties</li>
                      </ul>
                    </CardDescription>
                  </CardContent>
                </Card>

                <Card className={`cursor-pointer hover:border-primary transition-colors ${field.value === "standard" ? "border-primary bg-primary/5" : ""}`}
                  onClick={() => field.onChange("standard")}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Standard</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription>
                      <ul className="list-disc list-inside text-xs space-y-1">
                        <li>Detailed property valuation</li>
                        <li>Neighborhood market analysis</li>
                        <li>Up to 5 comparable properties</li>
                        <li>Recent sales analysis</li>
                      </ul>
                    </CardDescription>
                  </CardContent>
                </Card>

                <Card className={`cursor-pointer hover:border-primary transition-colors ${field.value === "detailed" ? "border-primary bg-primary/5" : ""}`}
                  onClick={() => field.onChange("detailed")}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Detailed</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription>
                      <ul className="list-disc list-inside text-xs space-y-1">
                        <li>Comprehensive property valuation</li>
                        <li>In-depth market trends analysis</li>
                        <li>Up to 8 comparable properties</li>
                        <li>Historical price trends</li>
                        <li>Future market projections</li>
                      </ul>
                    </CardDescription>
                  </CardContent>
                </Card>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
} 