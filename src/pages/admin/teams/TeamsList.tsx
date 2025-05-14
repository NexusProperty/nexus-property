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
  Search,
  Plus,
  Users,
  Filter,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  BarChart
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

// Placeholder team data
const mockTeams = [
  {
    id: 1,
    name: 'Management',
    lead: 'Sarah Johnson',
    members: 4,
    properties: 0,
    appraisals: 0,
    averageRating: 0,
    appraisalTime: '0 days',
    region: 'All',
    specialty: 'Administration',
    performanceTrend: 'stable'
  },
  {
    id: 2,
    name: 'West Region',
    lead: 'Michael Chen',
    members: 12,
    properties: 98,
    appraisals: 76,
    averageRating: 4.8,
    appraisalTime: '3.2 days',
    region: 'West',
    specialty: 'Mixed',
    performanceTrend: 'up'
  },
  {
    id: 3,
    name: 'East Region',
    lead: 'Jessica Williams',
    members: 10,
    properties: 85,
    appraisals: 62,
    averageRating: 4.6,
    appraisalTime: '3.5 days',
    region: 'East',
    specialty: 'Mixed',
    performanceTrend: 'up'
  },
  {
    id: 4,
    name: 'Commercial',
    lead: 'David Rodriguez',
    members: 7,
    properties: 54,
    appraisals: 41,
    averageRating: 4.7,
    appraisalTime: '4.8 days',
    region: 'All',
    specialty: 'Commercial',
    performanceTrend: 'up'
  },
  {
    id: 5,
    name: 'Residential',
    lead: 'Amanda Lee',
    members: 8,
    properties: 132,
    appraisals: 94,
    averageRating: 4.9,
    appraisalTime: '2.1 days',
    region: 'All',
    specialty: 'Residential',
    performanceTrend: 'up'
  },
  {
    id: 6,
    name: 'Client Services',
    lead: 'Robert Johnson',
    members: 5,
    properties: 0,
    appraisals: 0,
    averageRating: 4.5,
    appraisalTime: '0 days',
    region: 'All',
    specialty: 'Support',
    performanceTrend: 'stable'
  },
  {
    id: 7,
    name: 'Technical Support',
    lead: 'Emma Thompson',
    members: 3,
    properties: 0,
    appraisals: 0,
    averageRating: 4.3,
    appraisalTime: '0 days',
    region: 'All',
    specialty: 'Support',
    performanceTrend: 'down'
  }
];

type TeamSpecialty = 'All' | 'Mixed' | 'Commercial' | 'Residential' | 'Administration' | 'Support';
type TeamRegion = 'All' | 'West' | 'East';

const TeamsList: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<TeamSpecialty>('All');
  const [selectedRegion, setSelectedRegion] = useState<TeamRegion>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Filter teams based on search query, specialty, and region
  const filteredTeams = mockTeams.filter(team => {
    const matchesSearch = 
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.lead.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSpecialty = selectedSpecialty === 'All' || team.specialty === selectedSpecialty;
    const matchesRegion = selectedRegion === 'All' || team.region === selectedRegion;
    
    return matchesSearch && matchesSpecialty && matchesRegion;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredTeams.length / itemsPerPage);
  const paginatedTeams = filteredTeams.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSpecialtyChange = (value: string) => {
    setSelectedSpecialty(value as TeamSpecialty);
    setCurrentPage(1);
  };

  const handleRegionChange = (value: string) => {
    setSelectedRegion(value as TeamRegion);
    setCurrentPage(1);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleTeamClick = (teamId: number) => {
    navigate(`/admin/teams/${teamId}`);
  };

  // Function to render performance trend icon
  const renderPerformanceTrend = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <ArrowRightLeft className="h-4 w-4 text-amber-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Team Management</h1>
        <p className="text-muted-foreground">
          Manage teams, performance, and member assignments.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <CardTitle>Teams</CardTitle>
              <CardDescription>
                Total of {mockTeams.length} teams in the system.
              </CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create New Team
            </Button>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by team name or lead..."
                className="pl-8"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
            
            <div className="flex gap-2">
              <Select
                value={selectedSpecialty}
                onValueChange={handleSpecialtyChange}
              >
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Specialty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Specialties</SelectItem>
                  <SelectItem value="Commercial">Commercial</SelectItem>
                  <SelectItem value="Residential">Residential</SelectItem>
                  <SelectItem value="Mixed">Mixed</SelectItem>
                  <SelectItem value="Administration">Administration</SelectItem>
                  <SelectItem value="Support">Support</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={selectedRegion}
                onValueChange={handleRegionChange}
              >
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Regions</SelectItem>
                  <SelectItem value="West">West</SelectItem>
                  <SelectItem value="East">East</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team</TableHead>
                <TableHead>Lead</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Properties</TableHead>
                <TableHead>Appraisals</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTeams.length > 0 ? (
                paginatedTeams.map(team => (
                  <TableRow key={team.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleTeamClick(team.id)}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-1.5 rounded-full">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div>{team.name}</div>
                          <div className="text-xs text-muted-foreground">{team.specialty}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{team.lead}</TableCell>
                    <TableCell>{team.members}</TableCell>
                    <TableCell>{team.properties}</TableCell>
                    <TableCell>{team.appraisals}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {renderPerformanceTrend(team.performanceTrend)}
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium">
                              {team.averageRating > 0 ? team.averageRating.toFixed(1) : 'N/A'}
                            </span>
                            {team.averageRating > 0 && (
                              <span className="text-xs text-muted-foreground">rating</span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {team.appraisalTime !== '0 days' ? `Avg. ${team.appraisalTime}` : 'No appraisals'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
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
                              Edit Team
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              Manage Members
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              View Performance
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-500">
                              Delete Team
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
                    No teams found matching the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {filteredTeams.length > itemsPerPage && (
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
      
      {/* Performance Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Team Performance Metrics</CardTitle>
          <CardDescription>
            Overview of team performance indicators.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-full">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Members</p>
                  <p className="text-2xl font-bold">
                    {mockTeams.reduce((sum, team) => sum + team.members, 0)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 dark:bg-green-900/20 p-2 rounded-full">
                  <BarChart className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Average Rating</p>
                  <p className="text-2xl font-bold">
                    {(mockTeams.reduce((sum, team) => sum + team.averageRating, 0) / 
                      mockTeams.filter(t => t.averageRating > 0).length).toFixed(1)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 dark:bg-purple-900/20 p-2 rounded-full">
                  <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Top Performing</p>
                  <p className="text-xl font-bold">
                    {mockTeams.sort((a, b) => b.averageRating - a.averageRating)[0].name}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 dark:bg-amber-900/20 p-2 rounded-full">
                  <ArrowRightLeft className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Appraisal Time</p>
                  <p className="text-xl font-bold">
                    {mockTeams
                      .filter(t => t.appraisalTime !== '0 days')
                      .map(t => parseFloat(t.appraisalTime))
                      .reduce((sum, days, _, arr) => sum + days / arr.length, 0)
                      .toFixed(1)} days
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamsList; 