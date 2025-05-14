import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Search,
  Plus,
  UserCog,
  UserCircle,
  Filter,
  MoreHorizontal,
  Check,
  X
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Placeholder user data
const mockUsers = [
  {
    id: 1,
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    role: 'Admin',
    status: 'Active',
    lastActive: '5 minutes ago',
    createdAt: '2023-05-10',
    properties: 0,
    appraisals: 0
  },
  {
    id: 2,
    name: 'Michael Chen',
    email: 'michael.chen@example.com',
    role: 'Agent',
    status: 'Active',
    lastActive: '2 hours ago',
    createdAt: '2023-04-22',
    properties: 12,
    appraisals: 8
  },
  {
    id: 3,
    name: 'Jessica Williams',
    email: 'jessica.williams@example.com',
    role: 'Agent',
    status: 'Active',
    lastActive: '1 day ago',
    createdAt: '2023-03-15',
    properties: 18,
    appraisals: 15
  },
  {
    id: 4,
    name: 'David Rodriguez',
    email: 'david.rodriguez@example.com',
    role: 'Customer',
    status: 'Active',
    lastActive: '3 days ago',
    createdAt: '2023-02-28',
    properties: 2,
    appraisals: 1
  },
  {
    id: 5,
    name: 'Amanda Lee',
    email: 'amanda.lee@example.com',
    role: 'Agent',
    status: 'Inactive',
    lastActive: '2 weeks ago',
    createdAt: '2023-01-12',
    properties: 5,
    appraisals: 4
  },
  {
    id: 6,
    name: 'Robert Johnson',
    email: 'robert.johnson@example.com',
    role: 'Customer',
    status: 'Pending',
    lastActive: 'Never',
    createdAt: '2023-06-01',
    properties: 0,
    appraisals: 0
  },
  {
    id: 7,
    name: 'Emma Thompson',
    email: 'emma.thompson@example.com',
    role: 'Agent',
    status: 'Active',
    lastActive: '1 hour ago',
    createdAt: '2023-04-18',
    properties: 9,
    appraisals: 7
  },
  {
    id: 8,
    name: 'Alex Martinez',
    email: 'alex.martinez@example.com',
    role: 'Customer',
    status: 'Active',
    lastActive: '6 hours ago',
    createdAt: '2023-05-20',
    properties: 1,
    appraisals: 1
  },
];

type UserRole = 'All' | 'Admin' | 'Agent' | 'Customer';
type UserStatus = 'All' | 'Active' | 'Inactive' | 'Pending';

const UsersList: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('All');
  const [selectedStatus, setSelectedStatus] = useState<UserStatus>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Filter users based on search query, role, and status
  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = selectedRole === 'All' || user.role === selectedRole;
    const matchesStatus = selectedStatus === 'All' || user.status === selectedStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleRoleChange = (value: string) => {
    setSelectedRole(value as UserRole);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value as UserStatus);
    setCurrentPage(1);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleUserClick = (userId: number) => {
    navigate(`/admin/users/${userId}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Manage users, permissions, and roles.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                Total of {mockUsers.length} users in the system.
              </CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add New User
            </Button>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                className="pl-8"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
            
            <div className="flex gap-2">
              <Select
                value={selectedRole}
                onValueChange={handleRoleChange}
              >
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Roles</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Agent">Agent</SelectItem>
                  <SelectItem value="Customer">Customer</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={selectedStatus}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Properties</TableHead>
                <TableHead>Appraisals</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map(user => (
                  <TableRow key={user.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleUserClick(user.id)}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-1.5 rounded-full">
                          <UserCircle className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div>{user.name}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        user.role === 'Admin' 
                          ? 'default'
                          : user.role === 'Agent'
                            ? 'secondary'
                            : 'outline'
                      }>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {user.status === 'Active' ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : user.status === 'Pending' ? (
                          <div className="h-4 w-4 rounded-full bg-amber-400" />
                        ) : (
                          <X className="h-4 w-4 text-red-500" />
                        )}
                        <span className={
                          user.status === 'Active'
                            ? 'text-green-500'
                            : user.status === 'Pending'
                              ? 'text-amber-500'
                              : 'text-red-500'
                        }>
                          {user.status}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{user.lastActive}</TableCell>
                    <TableCell>{user.properties}</TableCell>
                    <TableCell>{user.appraisals}</TableCell>
                    <TableCell className="text-right">
                      <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-500">
                              Disable Account
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                    No users found matching the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {filteredUsers.length > itemsPerPage && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        isActive={currentPage === page}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersList; 