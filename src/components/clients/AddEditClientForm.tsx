import React, { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { 
  RadioGroup, 
  RadioGroupItem 
} from '@/components/ui/radio-group'
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  User, 
  Building, 
  Phone, 
  Mail,
  MapPin,
  CalendarDays 
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'

// Create a schema for client data validation
const clientFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().min(10, {
    message: "Please enter a valid phone number.",
  }),
  address: z.string().min(5, {
    message: "Address must be at least 5 characters.",
  }),
  city: z.string().min(2, {
    message: "City must be at least 2 characters.",
  }),
  state: z.string().min(2, {
    message: "Please select a state.",
  }),
  zipCode: z.string().min(5, {
    message: "Please enter a valid ZIP code.",
  }),
  type: z.enum(["individual", "corporate"]),
  company: z.string().optional(),
  status: z.enum(["active", "inactive"]),
  notes: z.string().optional(),
  contactPreferences: z.object({
    preferredMethod: z.enum(["email", "phone", "mail"]),
    emailOptIn: z.boolean().default(false),
    smsOptIn: z.boolean().default(false),
    mailOptIn: z.boolean().default(false),
    marketingOptIn: z.boolean().default(false),
    contactFrequency: z.enum(["weekly", "biweekly", "monthly", "quarterly", "asNeeded"]),
  }),
})

type ClientFormValues = z.infer<typeof clientFormSchema>

// Default client form values
const defaultValues: Partial<ClientFormValues> = {
  name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  type: "individual",
  company: "",
  status: "active",
  notes: "",
  contactPreferences: {
    preferredMethod: "email",
    emailOptIn: true,
    smsOptIn: false,
    mailOptIn: false,
    marketingOptIn: false,
    contactFrequency: "monthly",
  },
}

interface AddEditClientFormProps {
  initialValues?: Partial<ClientFormValues>
  isEditing?: boolean
  clientId?: string
}

export function AddEditClientForm({ 
  initialValues = defaultValues, 
  isEditing = false, 
  clientId 
}: AddEditClientFormProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<string>("basic")
  
  // Initialize form with either default values or provided initial values
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      ...defaultValues,
      ...initialValues,
    },
  })
  
  const clientType = form.watch("type")
  
  // Form submission handler
  const onSubmit = (data: ClientFormValues) => {
    console.log('Form submitted:', data)
    
    // In a real app, we would save the data to the database
    toast({
      title: isEditing ? "Client Updated" : "Client Created",
      description: isEditing 
        ? `Successfully updated ${data.name}'s information.` 
        : `Successfully created ${data.name} as a new client.`,
    })
  }
  
  const handleCancel = () => {
    // In a real app, this would navigate back to the clients list
    console.log('Cancel form')
    toast({
      title: "Action Cancelled",
      description: "Returning to clients list",
    })
  }
  
  const handleDelete = () => {
    // In a real app, this would show a confirmation dialog before deleting
    if (!isEditing) return
    
    console.log(`Delete client: ${clientId}`)
    toast({
      title: "Delete Client",
      description: "This would show a confirmation dialog",
      variant: "destructive"
    })
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={handleCancel}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Clients
        </Button>
        {isEditing && (
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Client
          </Button>
        )}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Edit Client" : "Add New Client"}</CardTitle>
          <CardDescription>
            {isEditing 
              ? "Update client information and preferences" 
              : "Enter client details to create a new client record"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs 
                value={activeTab} 
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">Basic Information</TabsTrigger>
                  <TabsTrigger value="preferences">Contact Preferences</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-6 pt-4">
                  {/* Client Type Selection */}
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel>Client Type</FormLabel>
                        <FormDescription>
                          Select whether this is an individual or a business client
                        </FormDescription>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid grid-cols-2 gap-4 pt-2"
                        >
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <RadioGroupItem value="individual" />
                            </FormControl>
                            <div className="space-y-1">
                              <FormLabel className="font-normal">
                                <div className="flex items-center">
                                  <User className="mr-2 h-4 w-4" />
                                  Individual
                                </div>
                              </FormLabel>
                              <FormDescription>
                                Personal client with residential properties
                              </FormDescription>
                            </div>
                          </FormItem>
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <RadioGroupItem value="corporate" />
                            </FormControl>
                            <div className="space-y-1">
                              <FormLabel className="font-normal">
                                <div className="flex items-center">
                                  <Building className="mr-2 h-4 w-4" />
                                  Corporate
                                </div>
                              </FormLabel>
                              <FormDescription>
                                Business client with commercial properties
                              </FormDescription>
                            </div>
                          </FormItem>
                        </RadioGroup>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Client Name */}
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter client name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Company Name (Only for corporate clients) */}
                    {clientType === "corporate" && (
                      <FormField
                        control={form.control}
                        name="company"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter company name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    {/* Status */}
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select client status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Email */}
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="email@example.com" className="pl-8" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Phone */}
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="(555) 123-4567" className="pl-8" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Address */}
                    <div className="md:col-span-2">
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Street Address" className="pl-8" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {/* City */}
                    <FormField
                      control={form.control}
                      name="city"
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
                    
                    <div className="grid grid-cols-2 gap-4">
                      {/* State */}
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="State" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="AL">Alabama</SelectItem>
                                <SelectItem value="AK">Alaska</SelectItem>
                                <SelectItem value="AZ">Arizona</SelectItem>
                                <SelectItem value="CA">California</SelectItem>
                                <SelectItem value="CO">Colorado</SelectItem>
                                <SelectItem value="CT">Connecticut</SelectItem>
                                <SelectItem value="NY">New York</SelectItem>
                                <SelectItem value="TX">Texas</SelectItem>
                                {/* Add other states as needed */}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* ZIP Code */}
                      <FormField
                        control={form.control}
                        name="zipCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ZIP</FormLabel>
                            <FormControl>
                              <Input placeholder="ZIP Code" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {/* Notes */}
                    <div className="md:col-span-2">
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Additional notes about this client..." 
                                className="min-h-[100px]" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Include any relevant information about this client
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="button" 
                      onClick={() => setActiveTab("preferences")}
                    >
                      Next
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="preferences" className="space-y-6 pt-4">
                  <div className="grid gap-6">
                    {/* Preferred Contact Method */}
                    <FormField
                      control={form.control}
                      name="contactPreferences.preferredMethod"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel>Preferred Contact Method</FormLabel>
                          <FormDescription>
                            How would the client prefer to be contacted?
                          </FormDescription>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-3 gap-4 pt-2"
                          >
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <RadioGroupItem value="email" />
                              </FormControl>
                              <div className="space-y-1">
                                <FormLabel className="font-normal">
                                  <div className="flex items-center">
                                    <Mail className="mr-2 h-4 w-4" />
                                    Email
                                  </div>
                                </FormLabel>
                              </div>
                            </FormItem>
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <RadioGroupItem value="phone" />
                              </FormControl>
                              <div className="space-y-1">
                                <FormLabel className="font-normal">
                                  <div className="flex items-center">
                                    <Phone className="mr-2 h-4 w-4" />
                                    Phone
                                  </div>
                                </FormLabel>
                              </div>
                            </FormItem>
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <RadioGroupItem value="mail" />
                              </FormControl>
                              <div className="space-y-1">
                                <FormLabel className="font-normal">
                                  <div className="flex items-center">
                                    <MapPin className="mr-2 h-4 w-4" />
                                    Mail
                                  </div>
                                </FormLabel>
                              </div>
                            </FormItem>
                          </RadioGroup>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Contact Frequency */}
                    <FormField
                      control={form.control}
                      name="contactPreferences.contactFrequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Frequency</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="biweekly">Bi-weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="quarterly">Quarterly</SelectItem>
                              <SelectItem value="asNeeded">As Needed</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            How often would the client like to receive updates?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Separator />
                    
                    <div className="space-y-3">
                      <h3 className="text-lg font-medium">Communication Opt-ins</h3>
                      
                      {/* Email Opt-in */}
                      <FormField
                        control={form.control}
                        name="contactPreferences.emailOptIn"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Email Communications
                              </FormLabel>
                              <FormDescription>
                                Receive updates and notifications via email
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      {/* SMS Opt-in */}
                      <FormField
                        control={form.control}
                        name="contactPreferences.smsOptIn"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                SMS Notifications
                              </FormLabel>
                              <FormDescription>
                                Receive text messages for important updates
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      {/* Mail Opt-in */}
                      <FormField
                        control={form.control}
                        name="contactPreferences.mailOptIn"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Physical Mail
                              </FormLabel>
                              <FormDescription>
                                Receive physical copies of reports and documents
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      {/* Marketing Opt-in */}
                      <FormField
                        control={form.control}
                        name="contactPreferences.marketingOptIn"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Marketing Communications
                              </FormLabel>
                              <FormDescription>
                                Receive newsletters, promotional offers and market updates
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setActiveTab("basic")}
                    >
                      Previous
                    </Button>
                    <Button type="submit">
                      <Save className="mr-2 h-4 w-4" />
                      {isEditing ? 'Update Client' : 'Create Client'}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
} 