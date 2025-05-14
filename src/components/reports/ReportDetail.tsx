import React, { useState } from 'react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  Download, 
  FileText, 
  Share, 
  Calendar, 
  User, 
  Clock, 
  Building,
  Mail,
  MessageSquare,
  Home,
  Check,
  Copy,
  Settings,
  Printer,
  Eye
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'

// Mock report data (more detailed)
const mockReport = {
  id: 'r1',
  title: 'Commercial Property Valuation - 500 Main Street',
  type: 'Valuation',
  description: 'Comprehensive valuation report for the commercial property located at 500 Main Street, including market analysis, comparable properties, and future value projections.',
  propertyAddress: '500 Main Street, Metropolis, NY 10001',
  clientName: 'John Smith',
  clientCompany: 'Acme Properties',
  clientEmail: 'john.smith@acmeproperties.com',
  createdBy: 'Emily Johnson',
  createdDate: '2023-10-10',
  modifiedDate: '2023-10-15',
  publishedDate: '2023-10-15',
  status: 'published',
  format: 'pdf',
  size: '2.4 MB',
  pages: 24,
  accessCount: 8,
  sharedWith: [
    {
      name: 'Michael Chen',
      email: 'michael.chen@gmail.com',
      accessType: 'view'
    },
    {
      name: 'Sarah Williams',
      email: 'sarah@williamsrealestate.com',
      accessType: 'edit'
    }
  ],
  valuation: {
    amount: 2500000,
    currency: 'USD',
    date: '2023-10-10',
    confidenceLevel: 'high'
  },
  sections: [
    { 
      title: 'Executive Summary', 
      pageNumbers: '1-2',
      completed: true
    },
    { 
      title: 'Property Description', 
      pageNumbers: '3-6',
      completed: true
    },
    { 
      title: 'Market Analysis', 
      pageNumbers: '7-10',
      completed: true
    },
    { 
      title: 'Valuation Methodology', 
      pageNumbers: '11-15',
      completed: true
    },
    { 
      title: 'Comparable Properties', 
      pageNumbers: '16-20',
      completed: true
    },
    { 
      title: 'Final Valuation & Recommendation', 
      pageNumbers: '21-24',
      completed: true
    }
  ],
  tags: ['Commercial', 'Office Space', 'Metropolis', 'High Value']
}

export function ReportDetail() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<string>("preview")
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [shareEmail, setShareEmail] = useState('')
  const [sharePermission, setSharePermission] = useState('view')
  const [notifyOnAccess, setNotifyOnAccess] = useState(true)
  const [passwordProtect, setPasswordProtect] = useState(false)
  const [shareLinkCopied, setShareLinkCopied] = useState(false)
  
  // Mock report data
  const report = mockReport
  
  const handleBack = () => {
    console.log('Navigate back to reports list')
    toast({
      title: "Navigation",
      description: "Returning to reports list",
    })
  }
  
  const handleDownload = () => {
    console.log(`Download report: ${report.id}`)
    toast({
      title: "Download Started",
      description: `Downloading ${report.title}`,
    })
  }
  
  const handlePrint = () => {
    console.log(`Print report: ${report.id}`)
    toast({
      title: "Printing",
      description: "Preparing document for printing",
    })
  }
  
  const handleShare = () => {
    setShareDialogOpen(true)
  }
  
  const handleCopyShareLink = () => {
    console.log('Copy share link to clipboard')
    // In a real app, this would copy the actual link to the clipboard
    setShareLinkCopied(true)
    setTimeout(() => setShareLinkCopied(false), 2000)
    toast({
      title: "Link Copied",
      description: "Share link copied to clipboard",
    })
  }
  
  const handleShareSubmit = () => {
    console.log(`Share report with: ${shareEmail}, permission: ${sharePermission}`)
    toast({
      title: "Report Shared",
      description: `Shared with ${shareEmail}`,
    })
    setShareDialogOpen(false)
    setShareEmail('')
  }
  
  // Function to format currency
  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(value)
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
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Reports
        </Button>
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleShare}>
                  <Share className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Share Report</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handlePrint}>
                  <Printer className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Print Report</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        {/* Main content - 2/3 width on larger screens */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusBadge(report.status)}
                    <Badge variant="outline" className="text-xs">{report.format.toUpperCase()}</Badge>
                    <Badge variant="outline" className="text-xs">{report.pages} pages</Badge>
                  </div>
                  <CardTitle className="text-2xl">{report.title}</CardTitle>
                  <CardDescription className="mt-2 text-sm">
                    {report.description}
                  </CardDescription>
                </div>
                <div className="rounded-md bg-muted flex items-center justify-center w-16 h-16 flex-shrink-0">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="preview" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-3 mb-6">
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="history">Activity</TabsTrigger>
                </TabsList>
                
                <TabsContent value="preview" className="space-y-4">
                  {/* Preview mock - in real app this would display PDF/document content */}
                  {report.sections.map((section, index) => (
                    <div key={index} className="rounded-md border p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{section.title}</h3>
                          <Badge variant="outline" className="text-xs">Pages {section.pageNumbers}</Badge>
                        </div>
                        {section.completed && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <Check className="mr-1 h-3 w-3" />
                            Complete
                          </Badge>
                        )}
                      </div>
                      <div className="bg-muted rounded-md h-36 flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <Eye className="h-8 w-8 mx-auto mb-2" />
                          <p>Preview not available</p>
                          <p className="text-xs">Please download the full report to view all content</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </TabsContent>
                
                <TabsContent value="details" className="space-y-6">
                  {/* Report metadata */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-muted-foreground">Report Type</h3>
                      <p>{report.type}</p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-muted-foreground">Created By</h3>
                      <p>{report.createdBy}</p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-muted-foreground">Created Date</h3>
                      <p>{new Date(report.createdDate).toLocaleDateString()}</p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-muted-foreground">Last Modified</h3>
                      <p>{new Date(report.modifiedDate).toLocaleDateString()}</p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-muted-foreground">Published Date</h3>
                      <p>{new Date(report.publishedDate).toLocaleDateString()}</p>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-muted-foreground">File Size</h3>
                      <p>{report.size}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Valuation information */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Valuation Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Valuation Amount</h3>
                        <p className="text-xl font-semibold">
                          {formatCurrency(report.valuation.amount, report.valuation.currency)}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Valuation Date</h3>
                        <p>{new Date(report.valuation.date).toLocaleDateString()}</p>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Confidence Level</h3>
                        <p className="capitalize">{report.valuation.confidenceLevel}</p>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Tags */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {report.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="history" className="space-y-4">
                  {/* Viewers history */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Shared With</h3>
                    {report.sharedWith.length > 0 ? (
                      <div className="space-y-3">
                        {report.sharedWith.map((user, index) => (
                          <div key={index} className="flex items-center justify-between p-3 rounded-md border">
                            <div className="flex items-start gap-3">
                              <div className="rounded-full bg-muted flex items-center justify-center w-9 h-9">
                                <User className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div>
                                <div className="font-medium">{user.name}</div>
                                <div className="text-xs text-muted-foreground">{user.email}</div>
                              </div>
                            </div>
                            <Badge variant="outline">
                              {user.accessType === 'view' ? 'Viewer' : 'Editor'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">This report hasn't been shared with anyone yet.</p>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Access Statistics</h3>
                    <div className="p-3 rounded-md border">
                      <p className="text-sm">This report has been accessed <span className="font-semibold">{report.accessCount} times</span> since it was published.</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        {/* Sidebar - 1/3 width on larger screens */}
        <div className="space-y-6">
          {/* Property & Client Information */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Property & Client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Home className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <h3 className="font-medium text-sm">Property Address</h3>
                    <p className="text-sm text-muted-foreground">{report.propertyAddress}</p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <h3 className="font-medium text-sm">Client</h3>
                    <p className="text-sm text-muted-foreground">{report.clientName}</p>
                  </div>
                </div>
                
                {report.clientCompany && (
                  <div className="flex items-start gap-2">
                    <Building className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <h3 className="font-medium text-sm">Company</h3>
                      <p className="text-sm text-muted-foreground">{report.clientCompany}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <h3 className="font-medium text-sm">Email</h3>
                    <p className="text-sm text-muted-foreground">{report.clientEmail}</p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" className="w-full">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Contact Client
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download Report
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={handleShare}>
                <Share className="mr-2 h-4 w-4" />
                Share Report
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print Report
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Settings className="mr-2 h-4 w-4" />
                Edit Report Settings
              </Button>
            </CardContent>
          </Card>
          
          {/* Timeline */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="relative pl-6 pb-2">
              <div className="absolute top-0 bottom-0 left-2 w-px bg-muted-foreground/20" />
              
              <div className="mb-6 relative">
                <div className="absolute -left-6 top-1 rounded-full w-3 h-3 bg-primary" />
                <h3 className="font-medium text-sm">Report Published</h3>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>{new Date(report.publishedDate).toLocaleDateString()}</span>
                  <Clock className="h-3 w-3 ml-2 mr-1" />
                  <span>{new Date(report.publishedDate).toLocaleTimeString()}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  The report was finalized and published by {report.createdBy}.
                </p>
              </div>
              
              <div className="mb-6 relative">
                <div className="absolute -left-6 top-1 rounded-full w-3 h-3 bg-muted-foreground/70" />
                <h3 className="font-medium text-sm">Last Edited</h3>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>{new Date(report.modifiedDate).toLocaleDateString()}</span>
                  <Clock className="h-3 w-3 ml-2 mr-1" />
                  <span>{new Date(report.modifiedDate).toLocaleTimeString()}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Final changes made to the report content.
                </p>
              </div>
              
              <div className="relative">
                <div className="absolute -left-6 top-1 rounded-full w-3 h-3 bg-muted-foreground/70" />
                <h3 className="font-medium text-sm">Report Created</h3>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>{new Date(report.createdDate).toLocaleDateString()}</span>
                  <Clock className="h-3 w-3 ml-2 mr-1" />
                  <span>{new Date(report.createdDate).toLocaleTimeString()}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Report was initially created by {report.createdBy}.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Report</DialogTitle>
            <DialogDescription>
              Share this report with clients or team members.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="share-link">Share Link</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="share-link"
                  value="https://appraisalhub.com/reports/r1?share=true"
                  readOnly
                  className="flex-1"
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={handleCopyShareLink}
                  className="flex-shrink-0"
                >
                  {shareLinkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="Enter email address"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
              />
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="permission">Permission</Label>
                  <Select 
                    value={sharePermission} 
                    onValueChange={setSharePermission}
                  >
                    <SelectTrigger id="permission">
                      <SelectValue placeholder="Select permission" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="view">View only</SelectItem>
                      <SelectItem value="edit">Can edit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-4 mt-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="notify" 
                    checked={notifyOnAccess} 
                    onCheckedChange={setNotifyOnAccess}
                  />
                  <Label htmlFor="notify">Notify me when accessed</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="password" 
                    checked={passwordProtect} 
                    onCheckedChange={setPasswordProtect}
                  />
                  <Label htmlFor="password">Password protect</Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setShareDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleShareSubmit}
              disabled={!shareEmail}
            >
              Share
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 