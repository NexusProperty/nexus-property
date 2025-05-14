import React, { useState } from 'react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  ChevronDown, 
  Download, 
  Eye, 
  Filter, 
  FileText, 
  MoreHorizontal, 
  Plus, 
  Search, 
  Share, 
  Calendar
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

// Mock report data
const mockReports = [
  {
    id: 'r1',
    title: 'Commercial Property Valuation - 500 Main Street',
    type: 'Valuation',
    propertyAddress: '500 Main Street, Metropolis, NY',
    clientName: 'John Smith',
    date: '2023-10-15',
    status: 'published',
    format: 'pdf',
  },
  {
    id: 'r2',
    title: 'Residential Market Analysis - West Metro Region',
    type: 'Market Analysis',
    propertyAddress: 'N/A',
    clientName: 'Emily Johnson',
    date: '2023-10-10',
    status: 'draft',
    format: 'pdf',
  },
  {
    id: 'r3',
    title: 'Appraisal Report - 200 Park Avenue',
    type: 'Appraisal',
    propertyAddress: '200 Park Avenue, Metropolis, NY',
    clientName: 'John Smith',
    date: '2023-09-22',
    status: 'published',
    format: 'docx',
  },
  {
    id: 'r4',
    title: 'Property Condition Assessment - 150 Broadway',
    type: 'Condition',
    propertyAddress: '150 Broadway, Metropolis, NY',
    clientName: 'Michael Chen',
    date: '2023-09-15',
    status: 'review',
    format: 'pdf',
  },
  {
    id: 'r5',
    title: 'Investment Property Analysis - 300 River Road',
    type: 'Investment',
    propertyAddress: '300 River Road, Metropolis, NY',
    clientName: 'Sarah Williams',
    date: '2023-09-05',
    status: 'published',
    format: 'pdf',
  },
]

export function ReportsList() {
  const { toast } = useToast()
  const [reports, setReports] = useState(mockReports)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  
  // Filter reports based on search term and filters
  const filteredReports = reports.filter(report => {
    // Search filter
    const matchesSearch = 
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.propertyAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.clientName.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Type filter
    const matchesType = 
      typeFilter === 'all' || 
      report.type.toLowerCase() === typeFilter.toLowerCase()
    
    // Status filter
    const matchesStatus = 
      statusFilter === 'all' || 
      report.status === statusFilter
    
    return matchesSearch && matchesType && matchesStatus
  })
  
  // Handler for viewing a report
  const handleViewReport = (reportId: string) => {
    console.log(`View report: ${reportId}`)
    toast({
      title: "Opening Report",
      description: `Viewing report ID: ${reportId}`,
    })
  }
  
  // Handler for sharing a report
  const handleShareReport = (reportId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    console.log(`Share report: ${reportId}`)
    toast({
      title: "Share Report",
      description: `Opening sharing options for report ID: ${reportId}`,
    })
  }
  
  // Handler for downloading a report
  const handleDownloadReport = (reportId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    console.log(`Download report: ${reportId}`)
    toast({
      title: "Download Report",
      description: `Downloading report ID: ${reportId}`,
    })
  }
  
  // Handler for creating a new report
  const handleCreateReport = () => {
    console.log('Create new report')
    toast({
      title: "Create Report",
      description: "Opening report generation wizard",
    })
  }
  
  // Function to get status badge styling
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'published':
        return <Badge variant="default">Published</Badge>
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>
      case 'review':
        return <Badge variant="outline">In Review</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }
  
  // Function to get file format badge styling
  const getFormatBadge = (format: string) => {
    switch(format.toLowerCase()) {
      case 'pdf':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">{format.toUpperCase()}</Badge>
      case 'docx':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">{format.toUpperCase()}</Badge>
      case 'xlsx':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">{format.toUpperCase()}</Badge>
      default:
        return <Badge variant="outline">{format.toUpperCase()}</Badge>
    }
  }
  
  const handleResetFilters = () => {
    setSearchTerm('')
    setTypeFilter('all')
    setStatusFilter('all')
  }
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Reports</CardTitle>
              <CardDescription>
                View, share, and manage your property reports
              </CardDescription>
            </div>
            <Button onClick={handleCreateReport} className="sm:w-auto w-full">
              <Plus className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6 items-start sm:items-center justify-between">
            <div className="relative w-full sm:w-[350px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports by title, property, or client..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
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
                        <h4 className="mb-1 text-sm font-medium">Report Type</h4>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="All Types" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="valuation">Valuation</SelectItem>
                            <SelectItem value="appraisal">Appraisal</SelectItem>
                            <SelectItem value="market analysis">Market Analysis</SelectItem>
                            <SelectItem value="condition">Condition</SelectItem>
                            <SelectItem value="investment">Investment</SelectItem>
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
                            <SelectItem value="published">Published</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="review">In Review</SelectItem>
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
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[250px]">Report Title</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No reports match your search criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReports.map((report) => (
                    <TableRow 
                      key={report.id} 
                      onClick={() => handleViewReport(report.id)}
                      className="cursor-pointer"
                    >
                      <TableCell>
                        <div className="flex items-start gap-3">
                          <div className="rounded bg-muted flex items-center justify-center w-9 h-9">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="font-medium">{report.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {report.propertyAddress !== 'N/A' ? (
                                report.propertyAddress
                              ) : (
                                <span className="italic">No specific property</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{report.clientName}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-3 w-3 text-muted-foreground" />
                          {new Date(report.date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(report.status)}</TableCell>
                      <TableCell>{getFormatBadge(report.format)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={(e) => handleShareReport(report.id, e)}
                          >
                            <Share className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={(e) => handleDownloadReport(report.id, e)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleViewReport(report.id);
                              }}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleShareReport(report.id, e);
                              }}>
                                <Share className="mr-2 h-4 w-4" />
                                Share
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadReport(report.id, e);
                              }}>
                                <Download className="mr-2 h-4 w-4" />
                                Download
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 