import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { UserPlus, Trash2, Users } from 'lucide-react';

type Profile = Database['public']['Tables']['profiles']['Row'];
type PropertyAccessUser = {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  access_level: string;
};

interface PropertyAccessProps {
  propertyId: string;
  isOwner: boolean;
}

// Define the shape of the property access data returned from the database
interface PropertyAccessData {
  id: string;
  access_level: string;
  profiles: {
    id: string;
    full_name: string | null;
    email: string;
    role: string;
  };
}

export function PropertyAccess({ propertyId, isOwner }: PropertyAccessProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<PropertyAccessUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [accessLevel, setAccessLevel] = useState('viewer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!propertyId || !user) return;

    fetchPropertyAccess();
  }, [propertyId, user, fetchPropertyAccess]);

  const fetchPropertyAccess = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // This would ideally be a function call to a stored procedure
      // For demo purposes, we're using a simple select query
      const { data, error } = await supabase
        .from('property_access')
        .select(`
          id,
          access_level,
          profiles (
            id,
            full_name,
            email,
            role
          )
        `)
        .eq('property_id', propertyId);

      if (error) throw error;

      if (data) {
        const formattedUsers: PropertyAccessUser[] = (data as PropertyAccessData[]).map((item) => ({
          id: item.profiles.id,
          full_name: item.profiles.full_name,
          email: item.profiles.email,
          role: item.profiles.role,
          access_level: item.access_level,
        }));

        setUsers(formattedUsers);
      }
    } catch (err) {
      const e = err as Error;
      setError(e.message);
      console.error('Error fetching property access:', err);
    } finally {
      setIsLoading(false);
    }
  }, [propertyId]);

  const searchUsersByEmail = async (email: string) => {
    if (email.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', `%${email}%`)
        .limit(5);

      if (error) throw error;

      setSearchResults(data || []);
    } catch (err) {
      console.error('Error searching users:', err);
      toast({
        title: 'Error',
        description: 'Failed to search users. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddUser = async () => {
    if (!emailInput || !accessLevel || !propertyId || !user) {
      toast({
        title: 'Error',
        description: 'Please provide all required information',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // First, check if the user exists
      const { data: userExists, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', emailInput)
        .single();

      if (userError) {
        if (userError.code === 'PGRST116') {
          toast({
            title: 'User Not Found',
            description: `No user found with email ${emailInput}`,
            variant: 'destructive',
          });
        } else {
          throw userError;
        }
        return;
      }

      // Then, check if the user already has access
      const { data: accessExists, error: accessError } = await supabase
        .from('property_access')
        .select('id')
        .eq('property_id', propertyId)
        .eq('user_id', userExists.id);

      if (accessError) throw accessError;

      if (accessExists && accessExists.length > 0) {
        toast({
          title: 'Access Already Exists',
          description: `This user already has access to the property`,
          variant: 'destructive',
        });
        return;
      }

      // Add the user access
      const { error: addError } = await supabase
        .from('property_access')
        .insert({
          property_id: propertyId,
          user_id: userExists.id,
          access_level: accessLevel,
          granted_by: user.id,
        });

      if (addError) throw addError;

      toast({
        title: 'Access Granted',
        description: `Successfully granted ${accessLevel} access to ${emailInput}`,
      });

      // Refresh the access list
      fetchPropertyAccess();
      setIsAddDialogOpen(false);
      setEmailInput('');
      setAccessLevel('viewer');
    } catch (err) {
      console.error('Error adding user access:', err);
      toast({
        title: 'Error',
        description: 'Failed to add user access. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveAccess = async (userId: string) => {
    if (!propertyId || !user) return;

    try {
      const { error } = await supabase
        .from('property_access')
        .delete()
        .eq('property_id', propertyId)
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Access Removed',
        description: 'Successfully removed user access',
      });

      // Update the user list
      setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      console.error('Error removing access:', err);
      toast({
        title: 'Error',
        description: 'Failed to remove user access. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Property Access Management
        </CardTitle>
        <CardDescription>
          Manage who can access and view this property.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : (
          <>
            {users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No users have access</p>
                <p className="text-sm mb-4">
                  Add users to grant them access to this property.
                </p>
                {isOwner && (
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Access Level</TableHead>
                      {isOwner && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          {user.full_name || 'Unnamed User'}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell className="capitalize">{user.access_level}</TableCell>
                        {isOwner && (
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveAccess(user.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </CardContent>

      {isOwner && (
        <CardFooter className="justify-center border-t pt-4">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Grant Access
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Grant Property Access</DialogTitle>
                <DialogDescription>
                  Enter the email of the user you want to grant access to this property.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">User Email</label>
                  <Input
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value);
                      searchUsersByEmail(e.target.value);
                    }}
                    placeholder="user@example.com"
                  />
                  
                  {isSearching ? (
                    <div className="p-2 text-center">
                      <Spinner size="sm" />
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="border rounded-md overflow-hidden mt-1">
                      {searchResults.map((result) => (
                        <div
                          key={result.id}
                          className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                          onClick={() => setEmailInput(result.email)}
                        >
                          <div className="font-medium">
                            {result.full_name || 'Unnamed User'}
                          </div>
                          <div className="text-sm text-gray-500">{result.email}</div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Access Level</label>
                  <Select
                    value={accessLevel}
                    onValueChange={setAccessLevel}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select access level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    <span className="font-medium">Viewer:</span> Can view property details<br />
                    <span className="font-medium">Editor:</span> Can view and edit property details<br />
                    <span className="font-medium">Admin:</span> Full access, including managing user access
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddUser}
                  disabled={isSubmitting || !emailInput || !accessLevel}
                >
                  {isSubmitting ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Adding...
                    </>
                  ) : (
                    'Add User'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardFooter>
      )}
    </Card>
  );
} 