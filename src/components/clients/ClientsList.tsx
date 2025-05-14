import React, { useState } from 'react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { 
  ChevronDown, 
  Filter, 
  Plus, 
  Search, 
  User, 
  Building, 
  Phone, 
  Mail,
  MoreHorizontal 
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'

// Mock client data
const mockClients = [
  {
    id: '1',
    name: 'John Smith',
    company: 'Acme Properties',
    email: 'john.smith@acmeproperties.com',
    phone: '(555) 123-4567',
    status: 'active',
    propertyCount: 3,
    appraisalCount: 5,
    lastContact: '2023-10-15',
    type: 'corporate'
  },
  {
    id: '2',
    name: 'Emily Johnson',
    company: 'Johnson Estates',
    email: 'emily@johnsonestates.com',
    phone: '(555) 234-5678',
    status: 'active',
    propertyCount: 7,
    appraisalCount: 12,
    lastContact: '2023-10-10',
    type: 'corporate'
  },
  {
    id: '3',
    name: 'Michael Chen',
    company: '',
    email: 'michael.chen@gmail.com',
    phone: '(555) 345-6789',
    status: 'inactive',
    propertyCount: 1,
    appraisalCount: 1,
    lastContact: '2023-08-20',
    type: 'individual'
  },
  {
    id: '4',
    name: 'Sarah Williams',
    company: 'Williams Real Estate',
    email: 'sarah@williamsrealestate.com',
    phone: '(555) 456-7890',
    status: 'active',
    propertyCount: 4,
    appraisalCount: 8,
    lastContact: '2023-10-12',
    type: 'corporate'
  },
  {
    id: '5',
    name: 'Robert Taylor',
    company: '',
    email: 'robert.taylor@outlook.com',
    phone: '(555) 567-8901',
    status: 'active',
    propertyCount: 2,
    appraisalCount: 3,
    lastContact: '2023-10-05',
    type: 'individual'
  }
]

export function ClientsList() {
  const { toast } = useToast()
  const [clients, setClients] = useState(mockClients)
  const [searchTerm, setSearchTerm] = useState('')
  const [clientTypeFilter, setClientTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Filter clients based on search term and filters
  const filteredClients = clients.filter(client => {
    // Search filter
    const matchesSearch = 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm)
    
    // Type filter
    const matchesType = 
      clientTypeFilter === 'all' || 
      client.type === clientTypeFilter
    
    // Status filter
    const matchesStatus = 
      statusFilter === 'all' || 
      client.status === statusFilter
    
    return matchesSearch && matchesType && matchesStatus
  })

  // Handler to navigate to client detail
  const handleViewClient = (id: string) => {
    // In a real app, this would navigate to the client detail page
    console.log(`Navigate to client detail for ID: ${id}`)
    toast({
      title: "Client Selected",
      description: `Viewing client with ID: ${id}`,
    })
  }

  // Handler to create a new client
  const handleAddClient = () => {
    // In a real app, this would navigate to the add client form
    console.log('Navigate to add client form')
    toast({
      title: "Add Client",
      description: "Opening client creation form",
    })
  }

  const handleResetFilters = () => {
    setSearchTerm('')
    setClientTypeFilter('all')
    setStatusFilter('all')
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Clients</CardTitle>
              <CardDescription>
                Manage your client relationships
              </CardDescription>
            </div>
            <Button onClick={handleAddClient} className="sm:w-auto w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <div className="flex flex-col sm:flex-row gap-4 mb-6 items-start sm:items-center justify-between">
              <TabsList className="mb-0">
                <TabsTrigger value="all">All Clients</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="inactive">Inactive</TabsTrigger>
              </TabsList>
              
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-[260px]">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search clients..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="ml-auto">
                      <Filter className="mr-2 h-4 w-4" />
                      Filter
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[200px]">
                    <div className="p-2">
                      <div className="space-y-4">
                        <div>
                          <h4 className="mb-1 text-sm font-medium">Client Type</h4>
                          <Select value={clientTypeFilter} onValueChange={setClientTypeFilter}>
                            <SelectTrigger>
                              <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Types</SelectItem>
                              <SelectItem value="individual">Individual</SelectItem>
                              <SelectItem value="corporate">Corporate</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <h4 className="mb-1 text-sm font-medium">Status</h4>
                          <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                              <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Status</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button size="sm" variant="ghost" onClick={handleResetFilters} className="w-full">
                          Reset Filters
                        </Button>
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <TabsContent value="all" className="mt-0">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Properties</TableHead>
                      <TableHead>Appraisals</TableHead>
                      <TableHead>Last Contact</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No clients match your search criteria
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredClients.map((client) => (
                        <TableRow 
                          key={client.id} 
                          onClick={() => handleViewClient(client.id)}
                          className="cursor-pointer"
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="rounded-full bg-muted flex items-center justify-center w-9 h-9">
                                <User className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div>
                                <div className="font-medium">{client.name}</div>
                                {client.company && (
                                  <div className="text-xs text-muted-foreground flex items-center">
                                    <Building className="h-3 w-3 mr-1" />
                                    {client.company}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="flex items-center">
                                <Mail className="h-3 w-3 mr-1" />
                                {client.email}
                              </div>
                              <div className="flex items-center mt-1">
                                <Phone className="h-3 w-3 mr-1" />
                                {client.phone}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                              {client.status === 'active' ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>{client.propertyCount}</TableCell>
                          <TableCell>{client.appraisalCount}</TableCell>
                          <TableCell>{new Date(client.lastContact).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewClient(client.id);
                                }}>
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  console.log(`Edit client: ${client.id}`);
                                }}>
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    console.log(`Delete client: ${client.id}`);
                                  }}
                                >
                                  Delete
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
            </TabsContent>
            
            <TabsContent value="active" className="mt-0">
              <div className="rounded-md border">
                <Table>
                  {/* Same table structure but filtered for active clients */}
                  {/* This would be duplicated with filters pre-applied */}
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="inactive" className="mt-0">
              <div className="rounded-md border">
                <Table>
                  {/* Same table structure but filtered for inactive clients */}
                  {/* This would be duplicated with filters pre-applied */}
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
} 