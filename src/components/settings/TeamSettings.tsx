import React, { useState } from 'react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { 
  MoreHorizontal, 
  Plus, 
  Search, 
  Trash2, 
  UserPlus, 
  UserCog2,
  Mail,
  PaintBucket,
  Image,
  FileText,
  Save,
  Phone
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { ImageUploader } from '@/components/ui/upload/ImageUploader'
import { ColorPicker } from '@/components/ui/color-picker/ColorPicker'

// Mock team members data
const mockTeamMembers = [
  {
    id: '1',
    name: 'Emily Johnson',
    email: 'emily.johnson@appraisalhub.com',
    role: 'Admin',
    status: 'active',
    avatarUrl: '',
    joined: '2021-09-10',
  },
  {
    id: '2',
    name: 'Michael Rodriguez',
    email: 'michael.r@appraisalhub.com',
    role: 'Agent',
    status: 'active',
    avatarUrl: '',
    joined: '2022-02-15',
  },
  {
    id: '3',
    name: 'Sarah Thompson',
    email: 'sarah.t@appraisalhub.com',
    role: 'Agent',
    status: 'active',
    avatarUrl: '',
    joined: '2022-05-22',
  },
  {
    id: '4',
    name: 'David Wilson',
    email: 'david.w@appraisalhub.com',
    role: 'Agent',
    status: 'inactive',
    avatarUrl: '',
    joined: '2021-11-04',
  },
  {
    id: '5',
    name: 'Jennifer Martinez',
    email: 'jennifer.m@appraisalhub.com',
    role: 'Agent',
    status: 'pending',
    avatarUrl: '',
    joined: '2023-08-30',
  }
]

// Mock agency branding data
const mockAgencyBranding = {
  logoUrl: '',
  primaryColor: '#336699',
  disclaimerText: 'This appraisal is provided for informational purposes only and does not constitute a formal valuation. All data should be independently verified.',
  contactDetails: `
ABC Property Group Ltd.
123 Main Street, Auckland, New Zealand
Phone: (09) 123-4567
Email: info@abcproperty.co.nz
Website: www.abcproperty.co.nz
  `.trim()
}

export function TeamSettings() {
  const { toast } = useToast()
  const [members, setMembers] = useState(mockTeamMembers)
  const [searchTerm, setSearchTerm] = useState('')
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<string | null>(null)
  const [newInvite, setNewInvite] = useState({
    email: '',
    role: 'Agent'
  })
  const [activeTab, setActiveTab] = useState('members')
  const [branding, setBranding] = useState(mockAgencyBranding)
  const [isSaving, setIsSaving] = useState(false)
  
  // Filter members based on search term
  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.role.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })
  
  // Handler for sending invitations
  const handleSendInvite = () => {
    // Validate email
    if (!newInvite.email || !newInvite.email.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      })
      return
    }
    
    console.log('Sending invite to:', newInvite)
    
    // In a real app, this would send an invitation email
    toast({
      title: "Invitation Sent",
      description: `An invitation has been sent to ${newInvite.email}`,
    })
    
    // Add the new member to the list with pending status
    const newMember = {
      id: `new-${Date.now()}`,
      name: newInvite.email.split('@')[0], // Temporary name from email
      email: newInvite.email,
      role: newInvite.role,
      status: 'pending',
      avatarUrl: '',
      joined: new Date().toISOString().split('T')[0]
    }
    
    setMembers([...members, newMember])
    setInviteDialogOpen(false)
    setNewInvite({ email: '', role: 'Agent' })
  }
  
  // Handler for changing member role
  const handleChangeRole = (memberId: string, newRole: string) => {
    const updatedMembers = members.map(member => {
      if (member.id === memberId) {
        return { ...member, role: newRole }
      }
      return member
    })
    
    setMembers(updatedMembers)
    
    toast({
      title: "Role Updated",
      description: `Team member role has been updated to ${newRole}.`,
    })
  }
  
  // Handler for removing team members
  const handleRemoveMember = () => {
    if (!selectedMember) return
    
    const updatedMembers = members.filter(member => member.id !== selectedMember)
    setMembers(updatedMembers)
    
    toast({
      title: "Member Removed",
      description: "Team member has been removed from the team.",
    })
    
    setRemoveDialogOpen(false)
    setSelectedMember(null)
  }

  // Handler for logo upload
  const handleLogoUploaded = (url: string) => {
    setBranding({
      ...branding,
      logoUrl: url
    })
    
    toast({
      title: "Logo Updated",
      description: "Your agency logo has been updated.",
    })
  }

  // Handler for color change
  const handleColorChange = (color: string) => {
    setBranding({
      ...branding,
      primaryColor: color
    })
  }

  // Handler for saving branding changes
  const handleSaveBranding = async () => {
    setIsSaving(true)
    
    // Simulate API call delay
    setTimeout(() => {
      setIsSaving(false)
      
      toast({
        title: "Branding Saved",
        description: "Your agency branding has been updated successfully.",
      })
    }, 1000)
  }
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="members">Team Members</TabsTrigger>
          <TabsTrigger value="branding">Agency Branding</TabsTrigger>
        </TabsList>
        
        {/* Team Members Tab */}
        <TabsContent value="members">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>
                    Manage your team and their permissions
                  </CardDescription>
                </div>
                <Button onClick={() => setInviteDialogOpen(true)} className="sm:w-auto w-full">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Team Member
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6 items-start sm:items-center justify-between">
                <div className="relative w-full sm:w-[350px]">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search team members..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No team members match your search criteria
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMembers.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={member.avatarUrl} />
                                <AvatarFallback className="bg-primary/10">
                                  {member.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{member.name}</div>
                                <div className="text-xs text-muted-foreground">{member.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={member.role === 'Admin' ? 'default' : 'outline'}>
                              {member.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                member.status === 'active' ? 'default' : 
                                member.status === 'pending' ? 'secondary' : 'outline'
                              }
                            >
                              {member.status === 'active' ? 'Active' : 
                               member.status === 'pending' ? 'Pending' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(member.joined).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {member.status === 'pending' ? (
                                  <DropdownMenuItem onClick={() => {
                                    // Resend invitation
                                    toast({
                                      title: "Invitation Resent",
                                      description: `Invitation has been resent to ${member.email}.`,
                                    })
                                  }}>
                                    <Mail className="mr-2 h-4 w-4" />
                                    Resend Invitation
                                  </DropdownMenuItem>
                                ) : null}
                                <DropdownMenuItem onClick={() => handleChangeRole(member.id, member.role === 'Admin' ? 'Agent' : 'Admin')}>
                                  <UserCog2 className="mr-2 h-4 w-4" />
                                  {member.role === 'Admin' ? 'Change to Agent' : 'Change to Admin'}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => {
                                    setSelectedMember(member.id)
                                    setRemoveDialogOpen(true)
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Remove from Team
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t px-6 py-4">
              <div className="text-sm text-muted-foreground">
                {members.length} members total ({members.filter(m => m.status === 'active').length} active)
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Agency Branding Tab */}
        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>Agency Branding</CardTitle>
              <CardDescription>
                Customize the appearance of your agency's appraisal reports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                {/* Logo Upload */}
                <div className="space-y-2">
                  <Label>Agency Logo</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    This logo will appear on all appraisal reports
                  </p>
                  <ImageUploader
                    onImageUploaded={handleLogoUploaded}
                    currentImageUrl={branding.logoUrl}
                    aspectRatio="3/1"
                    uploadEndpoint="/api/upload-logo"
                    buttonText="Upload Agency Logo"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Recommended size: 600 x 200 pixels (JPG, PNG or WebP)
                  </p>
                </div>

                {/* Brand Color */}
                <div className="space-y-2">
                  <Label>Brand Color</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    This color will be used as an accent in your reports
                  </p>
                  <ColorPicker
                    value={branding.primaryColor}
                    onChange={handleColorChange}
                  />
                  <div className="mt-4 p-4 rounded-md" style={{ backgroundColor: `${branding.primaryColor}20` }}>
                    <div className="flex items-center">
                      <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: branding.primaryColor }}></div>
                      <span className="text-sm font-medium" style={{ color: branding.primaryColor }}>Preview text in your brand color</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Contact Details */}
              <div className="space-y-2">
                <Label>Agency Contact Details</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  These details will be shown in the footer of appraisal reports
                </p>
                <Textarea
                  value={branding.contactDetails}
                  onChange={(e) => setBranding({ ...branding, contactDetails: e.target.value })}
                  rows={4}
                  placeholder="Enter your agency's contact information..."
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Include relevant information such as office address, phone, email, website, and registration numbers
                </p>
              </div>

              {/* Disclaimer */}
              <div className="space-y-2">
                <Label>Legal Disclaimer</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  This disclaimer will appear at the bottom of all appraisal reports
                </p>
                <Textarea
                  value={branding.disclaimerText}
                  onChange={(e) => setBranding({ ...branding, disclaimerText: e.target.value })}
                  rows={4}
                  placeholder="Enter your legal disclaimer text..."
                />
              </div>

              {/* Preview Section */}
              <div className="mt-8 border rounded-md p-6 bg-gray-50">
                <h3 className="text-lg font-medium mb-4">Preview</h3>
                <div className="bg-white p-4 rounded-md border mb-6">
                  {branding.logoUrl ? (
                    <img 
                      src={branding.logoUrl} 
                      alt="Agency Logo" 
                      className="max-h-16 mb-4" 
                    />
                  ) : (
                    <div 
                      className="h-16 border rounded flex items-center justify-center text-muted-foreground mb-4"
                      style={{ borderColor: branding.primaryColor }}
                    >
                      <Image className="h-6 w-6 mr-2" />
                      <span>Your Agency Logo</span>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <h4 className="font-medium" style={{ color: branding.primaryColor }}>Sample Title with Your Brand Color</h4>
                    <p className="text-sm">This is sample text to demonstrate how your branding will appear in reports.</p>
                    
                    <div className="text-xs mt-4 p-2 bg-gray-50 rounded border border-dashed">
                      <div className="font-medium mb-1">Contact Information:</div>
                      <p className="whitespace-pre-line">{branding.contactDetails || "Your contact details will appear here"}</p>
                    </div>
                    
                    <div className="text-xs mt-2 p-2 bg-gray-50 rounded border border-dashed">
                      <div className="font-medium mb-1">Disclaimer:</div>
                      <p>{branding.disclaimerText || "Your disclaimer text will appear here"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6">
              <Button onClick={handleSaveBranding} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Branding Settings
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Invite Member Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to a new team member to join your team.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                placeholder="colleague@example.com" 
                value={newInvite.email} 
                onChange={(e) => setNewInvite({...newInvite, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select 
                value={newInvite.role} 
                onValueChange={(value) => setNewInvite({...newInvite, role: value})}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Agent">Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendInvite}>
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Remove Member Dialog */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this team member? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 