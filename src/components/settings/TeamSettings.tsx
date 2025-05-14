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
import { Label } from '@/components/ui/label'
import { 
  MoreHorizontal, 
  Plus, 
  Search, 
  Trash2, 
  UserPlus, 
  UserCog2,
  Mail
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

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
  
  return (
    <div className="space-y-6">
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