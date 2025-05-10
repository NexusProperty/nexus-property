import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  fetchTeamById, 
  fetchTeamMembers, 
  updateTeam, 
  deleteTeam,
  addTeamMember,
  updateTeamMemberRole,
  removeTeamMember
} from "@/services/teamService";
import { Team, TeamMember, TeamRole } from "@/types/team";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, Edit, Trash, UserPlus, UserMinus, Shield } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";

// Role badge component
const RoleBadge = ({ role }: { role: TeamRole }) => {
  const getRoleColor = (role: TeamRole) => {
    switch (role) {
      case "owner":
        return "bg-purple-500";
      case "admin":
        return "bg-blue-500";
      case "member":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Badge className={`${getRoleColor(role)} text-white`}>
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </Badge>
  );
};

// Team member card component
const TeamMemberCard = ({ 
  member, 
  isOwner, 
  onUpdateRole, 
  onRemoveMember 
}: { 
  member: TeamMember; 
  isOwner: boolean;
  onUpdateRole: (profileId: string, role: TeamRole) => void;
  onRemoveMember: (profileId: string) => void;
}) => {
  const profile = member.profiles;
  
  if (!profile) return null;
  
  const initials = profile.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'U';
  
  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{profile.full_name}</p>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <RoleBadge role={member.role} />
            {isOwner && member.role !== "owner" && (
              <div className="flex space-x-2">
                <Select
                  value={member.role}
                  onValueChange={(value) => onUpdateRole(profile.id, value as TeamRole)}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => onRemoveMember(profile.id)}
                >
                  <UserMinus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Add member dialog component
const AddMemberDialog = ({ 
  teamId, 
  onAddMember 
}: { 
  teamId: string; 
  onAddMember: (email: string, role: TeamRole) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("member");
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddMember(email, role);
    setEmail("");
    setRole("member");
    setOpen(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Invite a new member to your team by email.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="member@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={(value) => setRole(value as TeamRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Add Member</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Edit team dialog component
const EditTeamDialog = ({ 
  team, 
  onUpdateTeam 
}: { 
  team: Team; 
  onUpdateTeam: (teamId: string, data: Partial<Team>) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(team.name);
  const [description, setDescription] = useState(team.description || "");
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateTeam(team.id, { name, description });
    setOpen(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Edit className="mr-2 h-4 w-4" />
          Edit Team
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Team</DialogTitle>
          <DialogDescription>
            Update your team's information.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Team Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Delete team dialog component
const DeleteTeamDialog = ({ 
  teamId, 
  onDeleteTeam 
}: { 
  teamId: string; 
  onDeleteTeam: (teamId: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  
  const handleDelete = () => {
    onDeleteTeam(teamId);
    setOpen(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">
          <Trash className="mr-2 h-4 w-4" />
          Delete Team
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Team</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this team? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Main component
export const TeamDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { data: team, isLoading: isLoadingTeam, error: teamError } = useQuery({
    queryKey: ["team", id],
    queryFn: () => fetchTeamById(id as string),
    enabled: !!id,
  });
  
  const { data: members, isLoading: isLoadingMembers, error: membersError } = useQuery({
    queryKey: ["team-members", id],
    queryFn: () => fetchTeamMembers(id as string),
    enabled: !!id,
  });
  
  const updateTeamMutation = useMutation({
    mutationFn: ({ teamId, data }: { teamId: string; data: Partial<Team> }) => 
      updateTeam(teamId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team", id] });
      toast({
        title: "Team updated",
        description: "Your team has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update team. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const deleteTeamMutation = useMutation({
    mutationFn: (teamId: string) => deleteTeam(teamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast({
        title: "Team deleted",
        description: "Your team has been deleted successfully.",
      });
      navigate("/agent/team");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete team. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const addMemberMutation = useMutation({
    mutationFn: ({ teamId, email, role }: { teamId: string; email: string; role: TeamRole }) => 
      addTeamMember(teamId, email, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members", id] });
      toast({
        title: "Member added",
        description: "The member has been added to your team.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add member. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const updateMemberRoleMutation = useMutation({
    mutationFn: ({ teamId, profileId, role }: { teamId: string; profileId: string; role: TeamRole }) => 
      updateTeamMemberRole(teamId, profileId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members", id] });
      toast({
        title: "Role updated",
        description: "The member's role has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update role. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const removeMemberMutation = useMutation({
    mutationFn: ({ teamId, profileId }: { teamId: string; profileId: string }) => 
      removeTeamMember(teamId, profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members", id] });
      toast({
        title: "Member removed",
        description: "The member has been removed from your team.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove member. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const handleUpdateTeam = (teamId: string, data: Partial<Team>) => {
    updateTeamMutation.mutate({ teamId, data });
  };
  
  const handleDeleteTeam = (teamId: string) => {
    deleteTeamMutation.mutate(teamId);
  };
  
  const handleAddMember = (email: string, role: TeamRole) => {
    if (!id) return;
    addMemberMutation.mutate({ teamId: id, email, role });
  };
  
  const handleUpdateMemberRole = (profileId: string, role: TeamRole) => {
    if (!id) return;
    updateMemberRoleMutation.mutate({ teamId: id, profileId, role });
  };
  
  const handleRemoveMember = (profileId: string) => {
    if (!id) return;
    removeMemberMutation.mutate({ teamId: id, profileId });
  };
  
  if (isLoadingTeam || isLoadingMembers) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-[200px]" />
        </div>
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }
  
  if (teamError || membersError || !team) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium mb-2">Error loading team</h3>
        <p className="text-muted-foreground mb-4">
          There was a problem loading the team details. Please try again later.
        </p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }
  
  const isOwner = true; // This should be determined based on the current user's role
  
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{team.name}</h1>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-sm text-muted-foreground">
              Created on {formatDate(team.created_at)}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <EditTeamDialog team={team} onUpdateTeam={handleUpdateTeam} />
        <DeleteTeamDialog teamId={team.id} onDeleteTeam={handleDeleteTeam} />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Team Information</CardTitle>
          <CardDescription>Details about your team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
              <p className="mt-1">{team.name}</p>
            </div>
            
            {team.description && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
                <p className="mt-1">{team.description}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Team Members</h2>
        <AddMemberDialog teamId={team.id} onAddMember={handleAddMember} />
      </div>
      
      <div>
        {members && members.length > 0 ? (
          members.map((member) => (
            <TeamMemberCard 
              key={member.id} 
              member={member} 
              isOwner={isOwner}
              onUpdateRole={handleUpdateMemberRole}
              onRemoveMember={handleRemoveMember}
            />
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No members found in this team.</p>
          </div>
        )}
      </div>
    </div>
  );
}; 