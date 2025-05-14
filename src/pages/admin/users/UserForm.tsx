import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Building,
  Shield,
  Upload,
  Loader2,
  CheckCircle,
} from 'lucide-react';

// Validation schema for user form
const userFormSchema = z.object({
  firstName: z.string().min(2, { message: 'First name must be at least 2 characters' }),
  lastName: z.string().min(2, { message: 'Last name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  phone: z.string().min(10, { message: 'Please enter a valid phone number' }).optional(),
  role: z.enum(['Admin', 'Agent', 'Customer']),
  status: z.enum(['Active', 'Inactive', 'Pending']),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  sendWelcomeEmail: z.boolean().default(true),
  passwordResetRequired: z.boolean().default(true),
  bio: z.string().max(500, { message: 'Bio must be less than 500 characters' }).optional(),
  teams: z.array(z.string()).default([]),
  permissions: z.array(z.string()).default([]),
});

// Define available permissions by user role
const availablePermissions = {
  Admin: [
    'Manage Users',
    'Manage Teams',
    'System Settings',
    'View Reports',
    'Edit Reports',
    'Manage Properties',
    'Manage Appraisals',
    'Manage Clients'
  ],
  Agent: [
    'View Reports',
    'Edit Reports',
    'Manage Properties',
    'Manage Appraisals',
    'Manage Clients'
  ],
  Customer: [
    'View Own Properties',
    'View Own Appraisals',
    'Request Appraisals'
  ]
};

// Default permissions by role
const defaultPermissions = {
  Admin: [
    'Manage Users',
    'Manage Teams',
    'System Settings',
    'View Reports',
    'Edit Reports',
    'Manage Properties',
    'Manage Appraisals',
    'Manage Clients'
  ],
  Agent: [
    'View Reports',
    'Manage Properties',
    'Manage Appraisals',
    'Manage Clients'
  ],
  Customer: [
    'View Own Properties',
    'View Own Appraisals',
    'Request Appraisals'
  ]
};

// Available teams
const availableTeams = [
  'Management',
  'West Region',
  'East Region',
  'Commercial',
  'Residential',
  'Client Services',
  'Technical Support'
];

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserFormProps {
  editMode?: boolean;
  initialData?: Partial<UserFormValues>;
}

const UserForm: React.FC<UserFormProps> = ({ editMode = false, initialData = {} }) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [previewName, setPreviewName] = useState(
    initialData.firstName && initialData.lastName 
      ? `${initialData.firstName} ${initialData.lastName}` 
      : ''
  );

  // Initialize the form
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      firstName: initialData.firstName || '',
      lastName: initialData.lastName || '',
      email: initialData.email || '',
      phone: initialData.phone || '',
      role: initialData.role || 'Customer',
      status: initialData.status || 'Active',
      address: initialData.address || '',
      city: initialData.city || '',
      state: initialData.state || '',
      zipCode: initialData.zipCode || '',
      sendWelcomeEmail: initialData.sendWelcomeEmail !== undefined ? initialData.sendWelcomeEmail : true,
      passwordResetRequired: initialData.passwordResetRequired !== undefined ? initialData.passwordResetRequired : true,
      bio: initialData.bio || '',
      teams: initialData.teams || [],
      permissions: initialData.permissions || defaultPermissions['Customer'],
    }
  });

  // Watch the changes in first name, last name, and role
  const role = form.watch('role');
  const firstName = form.watch('firstName');
  const lastName = form.watch('lastName');
  
  // Update the preview name when first or last name changes
  React.useEffect(() => {
    if (firstName && lastName) {
      setPreviewName(`${firstName} ${lastName}`);
    } else if (firstName) {
      setPreviewName(firstName);
    } else if (lastName) {
      setPreviewName(lastName);
    } else {
      setPreviewName('');
    }
  }, [firstName, lastName]);

  // When role changes, update permissions to default for that role
  React.useEffect(() => {
    if (role) {
      form.setValue('permissions', defaultPermissions[role]);
    }
  }, [role, form]);

  // Handle form submission
  const onSubmit = async (data: UserFormValues) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('User data submitted:', data);
      setIsSuccess(true);
      
      // In a real app, we would save the data and then navigate
      setTimeout(() => {
        navigate('/admin/users');
      }, 1500);
    } catch (error) {
      console.error('Error submitting user data:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackClick = () => {
    navigate('/admin/users');
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleBackClick}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {editMode ? 'Edit User' : 'Add New User'}
          </h1>
          <p className="text-muted-foreground">
            {editMode 
              ? 'Update user information and permissions.' 
              : 'Create a new user account and set permissions.'}
          </p>
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User Profile Card */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>User Profile</CardTitle>
                <CardDescription>
                  Profile information and settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center justify-center">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(previewName)}&background=random`} />
                    <AvatarFallback>
                      {previewName 
                        ? previewName.split(' ').map(n => n[0]).join('') 
                        : <User className="h-10 w-10" />}
                    </AvatarFallback>
                  </Avatar>
                  <Button variant="outline" size="sm" className="mb-2" type="button">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photo
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    JPG, PNG or GIF, max 2MB
                  </p>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Status</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Inactive">Inactive</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Set the user's account status.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>User Role</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Admin">Administrator</SelectItem>
                            <SelectItem value="Agent">Agent</SelectItem>
                            <SelectItem value="Customer">Customer</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Determines the user's permissions in the system.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <Separator />
                
                {!editMode && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="sendWelcomeEmail"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Send Welcome Email
                            </FormLabel>
                            <FormDescription>
                              Send an email with login instructions.
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
                    
                    <FormField
                      control={form.control}
                      name="passwordResetRequired"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Require Password Reset
                            </FormLabel>
                            <FormDescription>
                              User must set a new password on first login.
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
                )}
              </CardContent>
            </Card>
            
            {/* User Information Card */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Enter the user's personal and contact details.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter first name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter last name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="(555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-base font-medium mb-4">Address Information</h3>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Main St" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input placeholder="San Francisco" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <FormControl>
                              <Input placeholder="CA" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="zipCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ZIP Code</FormLabel>
                            <FormControl>
                              <Input placeholder="94105" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter a brief description about the user"
                          className="resize-none min-h-24"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        A short bio to describe this user.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            {/* Teams & Permissions Card */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Teams & Permissions</CardTitle>
                <CardDescription>
                  Assign the user to teams and manage access permissions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-base font-medium mb-4">Teams</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {availableTeams.map((team) => (
                      <FormField
                        key={team}
                        control={form.control}
                        name="teams"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(team)}
                                onCheckedChange={(checked) => {
                                  const updatedTeams = checked
                                    ? [...field.value, team]
                                    : field.value.filter((value) => value !== team);
                                  field.onChange(updatedTeams);
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {team}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-base font-medium mb-4">Permissions</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {availablePermissions[role].map((permission) => (
                      <FormField
                        key={permission}
                        control={form.control}
                        name="permissions"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(permission)}
                                onCheckedChange={(checked) => {
                                  const updatedPermissions = checked
                                    ? [...field.value, permission]
                                    : field.value.filter((value) => value !== permission);
                                  field.onChange(updatedPermissions);
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {permission}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBackClick}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !form.formState.isDirty || isSuccess}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editMode ? 'Updating...' : 'Creating...'}
                    </>
                  ) : isSuccess ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      {editMode ? 'Updated!' : 'Created!'}
                    </>
                  ) : (
                    editMode ? 'Update User' : 'Create User'
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default UserForm; 