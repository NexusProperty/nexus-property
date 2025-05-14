import React from 'react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
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
  ArrowLeft, 
  Calendar, 
  Edit, 
  Mail, 
  MapPin, 
  Phone, 
  User, 
  Building,
  Home, 
  FileText, 
  Clock, 
  Trash2
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useToast } from '@/components/ui/use-toast'

interface Property {
  id: string
  address: string
  city: string
  state: string
  zipCode: string
  type: string
  status: string
  lastAppraisal: string
}

interface Appraisal {
  id: string
  propertyAddress: string
  date: string
  value: number
  status: string
  type: string
}

interface Client {
  id: string
  name: string
  company: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  type: string
  status: string
  joinDate: string
  lastContact: string
  notes: string
  properties: Property[]
  appraisals: Appraisal[]
}

// Mock client data
const mockClient: Client = {
  id: '1',
  name: 'John Smith',
  company: 'Acme Properties',
  email: 'john.smith@acmeproperties.com',
  phone: '(555) 123-4567',
  address: '123 Business Ave, Suite 400',
  city: 'Metropolis',
  state: 'NY',
  zipCode: '10001',
  type: 'corporate',
  status: 'active',
  joinDate: '2022-03-15',
  lastContact: '2023-10-15',
  notes: 'Key client with multiple commercial properties. Prefers email communication and quarterly appraisal updates.',
  properties: [
    {
      id: 'p1',
      address: '500 Main Street',
      city: 'Metropolis',
      state: 'NY',
      zipCode: '10001',
      type: 'Commercial',
      status: 'Active',
      lastAppraisal: '2023-09-10'
    },
    {
      id: 'p2',
      address: '200 Park Avenue',
      city: 'Metropolis',
      state: 'NY',
      zipCode: '10002',
      type: 'Commercial',
      status: 'Active',
      lastAppraisal: '2023-08-22'
    },
    {
      id: 'p3',
      address: '150 Broadway',
      city: 'Metropolis',
      state: 'NY',
      zipCode: '10003',
      type: 'Residential',
      status: 'Active',
      lastAppraisal: '2023-07-15'
    }
  ],
  appraisals: [
    {
      id: 'a1',
      propertyAddress: '500 Main Street',
      date: '2023-09-10',
      value: 2500000,
      status: 'Completed',
      type: 'Commercial'
    },
    {
      id: 'a2',
      propertyAddress: '200 Park Avenue',
      date: '2023-08-22',
      value: 1800000,
      status: 'Completed',
      type: 'Commercial'
    },
    {
      id: 'a3',
      propertyAddress: '500 Main Street',
      date: '2023-03-15',
      value: 2350000,
      status: 'Completed',
      type: 'Commercial'
    },
    {
      id: 'a4',
      propertyAddress: '150 Broadway',
      date: '2023-07-15',
      value: 950000,
      status: 'Completed',
      type: 'Residential'
    },
    {
      id: 'a5',
      propertyAddress: '200 Park Avenue',
      date: '2023-02-10',
      value: 1750000,
      status: 'Completed',
      type: 'Commercial'
    }
  ]
}

export function ClientDetail() {
  const { toast } = useToast()
  const client = mockClient // In a real app, this would be fetched based on ID
  
  const handleEditClient = () => {
    // In a real app, this would navigate to the edit client form
    console.log(`Navigate to edit client: ${client.id}`)
    toast({
      title: "Edit Client",
      description: "Opening client edit form",
    })
  }
  
  const handleDeleteClient = () => {
    // In a real app, this would show a confirmation dialog
    console.log(`Delete client: ${client.id}`)
    toast({
      title: "Delete Client",
      description: "This would show a confirmation dialog",
      variant: "destructive"
    })
  }
  
  const handleBack = () => {
    // In a real app, this would navigate back to the clients list
    console.log('Navigate back to clients list')
    toast({
      title: "Navigation",
      description: "Returning to clients list",
    })
  }
  
  const handleViewProperty = (propertyId: string) => {
    // In a real app, this would navigate to the property detail
    console.log(`Navigate to property detail: ${propertyId}`)
    toast({
      title: "View Property",
      description: `Opening property details for ID: ${propertyId}`,
    })
  }
  
  const handleViewAppraisal = (appraisalId: string) => {
    // In a real app, this would navigate to the appraisal detail
    console.log(`Navigate to appraisal detail: ${appraisalId}`)
    toast({
      title: "View Appraisal",
      description: `Opening appraisal details for ID: ${appraisalId}`,
    })
  }
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Clients
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleEditClient}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Client
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDeleteClient}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-7">
        {/* Client Info Column */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center mb-6">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarFallback className="text-2xl">
                    {client.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-bold">{client.name}</h3>
                {client.company && (
                  <div className="flex items-center text-muted-foreground">
                    <Building className="h-4 w-4 mr-1" />
                    <span>{client.company}</span>
                  </div>
                )}
                <Badge 
                  className="mt-2" 
                  variant={client.status === 'active' ? 'default' : 'secondary'}
                >
                  {client.status === 'active' ? 'Active' : 'Inactive'}
                </Badge>
                <Badge className="mt-2" variant="outline">
                  {client.type === 'corporate' ? 'Corporate' : 'Individual'}
                </Badge>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{client.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{client.phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Address</p>
                    <p className="text-sm text-muted-foreground">
                      {client.address}<br />
                      {client.city}, {client.state} {client.zipCode}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Client Since</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(client.joinDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Last Contact</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(client.lastContact).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{client.notes}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Activity Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold">{client.properties.length}</p>
                    <p className="text-xs text-muted-foreground">Properties</p>
                  </div>
                  <div className="bg-muted p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold">{client.appraisals.length}</p>
                    <p className="text-xs text-muted-foreground">Appraisals</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold">{
                      Math.round((new Date().getTime() - new Date(client.joinDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
                    }</p>
                    <p className="text-xs text-muted-foreground">Months Active</p>
                  </div>
                  <div className="bg-muted p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold">{
                      Math.round((new Date().getTime() - new Date(client.lastContact).getTime()) / (1000 * 60 * 60 * 24))
                    }</p>
                    <p className="text-xs text-muted-foreground">Days Since Contact</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Properties & Appraisals Column */}
        <div className="md:col-span-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Client Portfolio</CardTitle>
              <CardDescription>Properties and appraisal history</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="properties" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="properties">Properties</TabsTrigger>
                  <TabsTrigger value="appraisals">Appraisal History</TabsTrigger>
                </TabsList>
                
                <TabsContent value="properties" className="mt-0">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Address</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Last Appraisal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {client.properties.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                              No properties found for this client
                            </TableCell>
                          </TableRow>
                        ) : (
                          client.properties.map((property) => (
                            <TableRow 
                              key={property.id}
                              className="cursor-pointer"
                              onClick={() => handleViewProperty(property.id)}
                            >
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Home className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <div className="font-medium">{property.address}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {property.city}, {property.state} {property.zipCode}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{property.type}</TableCell>
                              <TableCell>
                                <Badge variant={property.status === 'Active' ? 'default' : 'secondary'}>
                                  {property.status}
                                </Badge>
                              </TableCell>
                              <TableCell>{new Date(property.lastAppraisal).toLocaleDateString()}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                
                <TabsContent value="appraisals" className="mt-0">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Property</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {client.appraisals.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                              No appraisals found for this client
                            </TableCell>
                          </TableRow>
                        ) : (
                          client.appraisals.map((appraisal) => (
                            <TableRow 
                              key={appraisal.id}
                              className="cursor-pointer"
                              onClick={() => handleViewAppraisal(appraisal.id)}
                            >
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Home className="h-4 w-4 text-muted-foreground" />
                                  <div className="font-medium">{appraisal.propertyAddress}</div>
                                </div>
                              </TableCell>
                              <TableCell>{new Date(appraisal.date).toLocaleDateString()}</TableCell>
                              <TableCell className="font-medium">
                                {formatCurrency(appraisal.value)}
                              </TableCell>
                              <TableCell>{appraisal.type}</TableCell>
                              <TableCell>
                                <Badge variant={appraisal.status === 'Completed' ? 'default' : 'secondary'}>
                                  {appraisal.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 