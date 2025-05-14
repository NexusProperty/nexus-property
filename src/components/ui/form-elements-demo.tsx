import * as React from "react";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormContext,
  FormField,
  FormTextarea,
  FormCheckbox,
  FormRadioGroup,
  FormSelect,
  FormActions,
  createFormSchema,
  useZodForm,
  FormErrors
} from "@/components/ui/form-elements";

// Define the form schema
const contactSchema = createFormSchema({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  subject: z.string().min(1, "Please select a subject"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms and conditions"
  }),
  preferredContact: z.enum(["email", "phone", "any"], {
    required_error: "Please select a preferred contact method"
  })
});

type ContactFormValues = z.infer<typeof contactSchema>;

const subjectOptions = [
  { value: "general", label: "General Inquiry" },
  { value: "support", label: "Technical Support" },
  { value: "billing", label: "Billing Question" },
  { value: "feedback", label: "Feedback" }
];

const contactMethodOptions = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "any", label: "Either is fine" }
];

export function FormElementsDemo() {
  const [submittedData, setSubmittedData] = React.useState<ContactFormValues | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useZodForm(contactSchema, {
    fullName: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    agreeToTerms: false,
    preferredContact: "email"
  });

  const onSubmit = async (data: ContactFormValues) => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setSubmittedData(data);
    setIsSubmitting(false);
  };

  const handleReset = () => {
    form.reset();
    setSubmittedData(null);
  };

  return (
    <div className="container max-w-4xl py-10">
      <h1 className="text-3xl font-bold mb-8">Form Elements Library Demo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Contact Form</CardTitle>
              <CardDescription>Demonstrates various form elements with validation</CardDescription>
            </CardHeader>
            <CardContent>
              <FormContext form={form} onSubmit={onSubmit}>
                <FormField
                  name="fullName"
                  label="Full Name"
                  placeholder="John Doe"
                  required
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    name="email"
                    label="Email Address"
                    type="email"
                    placeholder="john.doe@example.com"
                    required
                    description="We'll never share your email with anyone else."
                  />
                  
                  <FormField
                    name="phone"
                    label="Phone Number"
                    type="tel"
                    placeholder="(123) 456-7890"
                  />
                </div>
                
                <FormSelect
                  name="subject"
                  label="Subject"
                  options={subjectOptions}
                  required
                />
                
                <FormRadioGroup
                  name="preferredContact"
                  label="Preferred Contact Method"
                  options={contactMethodOptions}
                  required
                />
                
                <FormTextarea
                  name="message"
                  label="Message"
                  placeholder="Enter your message here..."
                  required
                  rows={4}
                />
                
                <FormCheckbox
                  name="agreeToTerms"
                  label="I agree to the terms and conditions"
                  required
                  description="By checking this box, you agree to our Terms of Service and Privacy Policy."
                />
                
                <FormErrors errors={form.formState.errors} />
                
                <FormActions
                  submitLabel="Send Message"
                  cancelLabel="Reset"
                  onCancel={handleReset}
                  isSubmitting={isSubmitting}
                />
              </FormContext>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Form Submission Result</CardTitle>
              <CardDescription>Data received from the form</CardDescription>
            </CardHeader>
            <CardContent>
              {submittedData ? (
                <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[400px] text-sm">
                  {JSON.stringify(submittedData, null, 2)}
                </pre>
              ) : (
                <p className="text-muted-foreground text-center py-10">
                  No data submitted yet. Fill out and submit the form to see the result here.
                </p>
              )}
            </CardContent>
            <CardFooter className="bg-muted/50">
              <p className="text-xs text-muted-foreground">
                This demo showcases form validation with Zod and React Hook Form.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
} 