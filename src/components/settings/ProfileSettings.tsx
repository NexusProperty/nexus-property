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
import { Textarea } from '@/components/ui/textarea'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs'
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from '@/components/ui/avatar'
import { 
  Bell, 
  Camera, 
  Check, 
  Edit, 
  Key, 
  Lock, 
  Mail, 
  Phone, 
  Save, 
  Shield, 
  User, 
  UserCog2
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/components/ui/use-toast'

const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().min(10, {
    message: "Please enter a valid phone number.",
  }),
  jobTitle: z.string().optional(),
  bio: z.string().max(500, {
    message: "Bio must not exceed 500 characters.",
  }).optional(),
  language: z.string({
    required_error: "Please select a language.",
  }),
  timeZone: z.string({
    required_error: "Please select a timezone.",
  }),
  notifications: z.object({
    emailReports: z.boolean().default(true),
    emailAlerts: z.boolean().default(true),
    pushNotifications: z.boolean().default(true),
    smsAlerts: z.boolean().default(false),
    weeklyDigest: z.boolean().default(true),
  }),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

// Mock user data
const mockUser = {
  id: '1',
  name: 'Emily Johnson',
  email: 'emily.johnson@appraisalhub.com',
  phone: '(555) 987-6543',
  jobTitle: 'Senior Appraiser',
  bio: 'Professional appraiser with over 10 years of experience in commercial and residential property valuation.',
  language: 'en',
  timeZone: 'America/New_York',
  avatarUrl: '',
  role: 'agent',
  joined: '2021-09-10',
  notifications: {
    emailReports: true,
    emailAlerts: true,
    pushNotifications: true,
    smsAlerts: false,
    weeklyDigest: true,
  }
}

export function ProfileSettings() {
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("profile")
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Initialize form with mock user data
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: mockUser.name,
      email: mockUser.email,
      phone: mockUser.phone,
      jobTitle: mockUser.jobTitle || '',
      bio: mockUser.bio || '',
      language: mockUser.language,
      timeZone: mockUser.timeZone,
      notifications: mockUser.notifications,
    },
  })

  // Form submission handler
  const onSubmit = (data: ProfileFormValues) => {
    console.log('Profile data submitted:', data)
    
    // In a real app, this would save the data to the database
    toast({
      title: "Profile Updated",
      description: "Your profile information has been updated successfully.",
    })
  }

  // Password change handler
  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "New password and confirmation must match.",
        variant: "destructive"
      })
      return
    }

    if (newPassword.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive"
      })
      return
    }

    console.log('Password change requested')
    
    // In a real app, this would verify the old password and update with the new one
    toast({
      title: "Password Updated",
      description: "Your password has been changed successfully.",
    })
    
    setPasswordDialogOpen(false)
    setOldPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  // Mock handler for avatar upload
  const handleAvatarUpload = () => {
    setIsUploading(true)
    
    // Simulate file upload delay
    setTimeout(() => {
      setIsUploading(false)
      toast({
        title: "Avatar Updated",
        description: "Your profile picture has been updated successfully.",
      })
    }, 1500)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left column */}
        <div className="lg:w-1/4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={mockUser.avatarUrl} />
                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                      {mockUser.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <Button 
                    size="icon" 
                    variant="outline" 
                    className="absolute bottom-0 right-0 rounded-full h-8 w-8"
                    onClick={handleAvatarUpload}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-bold">{mockUser.name}</h2>
                  <p className="text-sm text-muted-foreground">{mockUser.jobTitle}</p>
                </div>
                <Badge variant="secondary">
                  {mockUser.role === 'agent' ? 'Agent' : 'Admin'}
                </Badge>
                <div className="text-sm text-muted-foreground text-center">
                  <p>Member since {new Date(mockUser.joined).toLocaleDateString()}</p>
                </div>
                <Button className="w-full" variant="outline" onClick={() => setPasswordDialogOpen(true)}>
                  <Lock className="mr-2 h-4 w-4" />
                  Change Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right column */}
        <div className="lg:w-3/4">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your profile, preferences, and notification settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-2 mb-6">
                  <TabsTrigger value="profile">
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </TabsTrigger>
                  <TabsTrigger value="notifications">
                    <Bell className="h-4 w-4 mr-2" />
                    Notifications
                  </TabsTrigger>
                </TabsList>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)}>
                    {/* Profile Tab */}
                    <TabsContent value="profile">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-medium">Personal Information</h3>
                          <p className="text-sm text-muted-foreground">
                            Update your personal details and contact information
                          </p>
                        </div>
                        
                        <div className="grid gap-5">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Your name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Mail className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                      <Input placeholder="Your email" className="pl-8" {...field} />
                                    </div>
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
                                    <div className="relative">
                                      <Phone className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                      <Input placeholder="Your phone number" className="pl-8" {...field} />
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={form.control}
                            name="jobTitle"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Job Title</FormLabel>
                                <FormControl>
                                  <Input placeholder="Your job title" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="bio"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Bio</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Tell us about yourself" 
                                    className="min-h-[120px]" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription>
                                  Brief description for your profile. Maximum 500 characters.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h3 className="text-lg font-medium">Preferences</h3>
                          <p className="text-sm text-muted-foreground">
                            Customize your language and regional settings
                          </p>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="language"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Language</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select language" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="en">English</SelectItem>
                                    <SelectItem value="es">Spanish</SelectItem>
                                    <SelectItem value="fr">French</SelectItem>
                                    <SelectItem value="de">German</SelectItem>
                                    <SelectItem value="zh">Chinese</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="timeZone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Time Zone</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select timezone" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                                    <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                                    <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                                    <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                                    <SelectItem value="Europe/London">London (GMT)</SelectItem>
                                    <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                                    <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </TabsContent>
                    
                    {/* Notifications Tab */}
                    <TabsContent value="notifications">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-medium">Notification Settings</h3>
                          <p className="text-sm text-muted-foreground">
                            Customize how and when you receive notifications
                          </p>
                        </div>
                        
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="notifications.emailReports"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">
                                    Email Reports
                                  </FormLabel>
                                  <FormDescription>
                                    Receive generated reports via email
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
                            name="notifications.emailAlerts"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">
                                    Email Alerts
                                  </FormLabel>
                                  <FormDescription>
                                    Receive important alerts via email
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
                            name="notifications.pushNotifications"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">
                                    Push Notifications
                                  </FormLabel>
                                  <FormDescription>
                                    Receive notifications in-app and on your desktop
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
                            name="notifications.smsAlerts"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">
                                    SMS Alerts
                                  </FormLabel>
                                  <FormDescription>
                                    Receive critical alerts via text message
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
                            name="notifications.weeklyDigest"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">
                                    Weekly Digest
                                  </FormLabel>
                                  <FormDescription>
                                    Receive a weekly summary of your activities and pending tasks
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
                    </TabsContent>
                    
                    <div className="mt-6 flex justify-end">
                      <Button type="submit">
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </Button>
                    </div>
                  </form>
                </Form>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Password Change Dialog */}
      <AlertDialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Password</AlertDialogTitle>
            <AlertDialogDescription>
              Enter your current password and a new password to update your credentials.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <FormLabel htmlFor="current-password">Current Password</FormLabel>
              <div className="relative">
                <Key className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="current-password" 
                  type="password" 
                  placeholder="Current password" 
                  className="pl-8"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <FormLabel htmlFor="new-password">New Password</FormLabel>
              <div className="relative">
                <Lock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="new-password" 
                  type="password" 
                  placeholder="New password" 
                  className="pl-8"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <FormLabel htmlFor="confirm-password">Confirm Password</FormLabel>
              <div className="relative">
                <Shield className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="confirm-password" 
                  type="password" 
                  placeholder="Confirm new password" 
                  className="pl-8"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePasswordChange}>Change Password</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 