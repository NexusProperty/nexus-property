import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ArrowLeft,
  CheckCircle,
  Loader2,
  MessageSquare
} from 'lucide-react';

// Validation schema
const requestUpdateSchema = z.object({
  message: z.string()
    .min(10, { message: 'Your message must be at least 10 characters' })
    .max(500, { message: 'Your message must be less than 500 characters' }),
  expedite: z.boolean().default(false),
  sendCopy: z.boolean().default(true),
});

type FormValues = z.infer<typeof requestUpdateSchema>;

interface AppraisalBasicInfo {
  id: string;
  propertyAddress: string;
  propertyLocation: string;
  agent?: {
    name: string;
  };
}

const RequestUpdate: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [appraisal, setAppraisal] = useState<AppraisalBasicInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Initialize form with validation
  const form = useForm<FormValues>({
    resolver: zodResolver(requestUpdateSchema),
    defaultValues: {
      message: '',
      expedite: false,
      sendCopy: true,
    },
  });

  // Mock fetch appraisal data
  useEffect(() => {
    const fetchAppraisalBasicInfo = async () => {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock data
      const mockAppraisal: AppraisalBasicInfo = {
        id: id || 'apr1',
        propertyAddress: '123 Main Street',
        propertyLocation: 'San Francisco, CA 94105',
        agent: {
          name: 'John Smith',
        },
      };
      
      setAppraisal(mockAppraisal);
      setIsLoading(false);
    };

    fetchAppraisalBasicInfo();
  }, [id]);

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Update request submitted:', data);
      
      // Simulate successful submission
      setIsSuccess(true);
      
      // Reset after showing success message for a moment
      setTimeout(() => {
        navigate(`/dashboard/appraisals/${id}`);
      }, 2000);
    } catch (error) {
      console.error('Error submitting update request:', error);
      // Would handle error state here in a real implementation
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Error state if appraisal not found
  if (!appraisal) {
    return (
      <div className="text-center p-8">
        <h3 className="mt-4 text-lg font-semibold">Appraisal not found</h3>
        <p className="mt-2 text-muted-foreground">
          We couldn't find the appraisal you're looking for.
        </p>
        <Button asChild className="mt-4">
          <Link to="/dashboard/appraisals">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Appraisals
          </Link>
        </Button>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="rounded-full bg-green-100 p-3">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">Update Request Sent!</h3>
        <p className="mt-2 text-muted-foreground text-center max-w-md">
          Your request has been sent to {appraisal.agent?.name || "the appraiser"}. You'll receive a response soon.
        </p>
        <Button asChild className="mt-6">
          <Link to={`/dashboard/appraisals/${id}`}>
            Return to Appraisal Details
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/dashboard">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/dashboard/appraisals">My Appraisals</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to={`/dashboard/appraisals/${id}`}>Appraisal Details</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>Request Update</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Request an Update</h1>
          <p className="text-muted-foreground">
            Request an update on your appraisal for {appraisal.propertyAddress}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to={`/dashboard/appraisals/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appraisal Update Request</CardTitle>
          <CardDescription>
            Your message will be sent directly to {appraisal.agent?.name || "the appraiser"}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please provide an update on the status of my appraisal..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Be specific about what information you're looking for.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="expedite"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Request Expedited Response</FormLabel>
                        <FormDescription>
                          Mark this request as high priority (use only if urgent)
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sendCopy"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Send Me a Copy</FormLabel>
                        <FormDescription>
                          Receive a copy of this message in your email
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <CardFooter className="px-0 flex justify-end gap-4">
                <Button 
                  variant="outline" 
                  type="button"
                  onClick={() => navigate(`/dashboard/appraisals/${id}`)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Send Request
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RequestUpdate; 