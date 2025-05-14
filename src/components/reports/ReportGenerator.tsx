import React, { useState } from 'react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  FileText, 
  Download, 
  FileCode, 
  FilePieChart, 
  FileSpreadsheet, 
  Settings, 
  Copy, 
  Clock
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Steps, Step } from '@/components/ui/steps'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'

// Report template types
const reportTemplates = [
  {
    id: 'template-1',
    title: 'Standard Valuation Report',
    description: 'Comprehensive valuation report with detailed market analysis',
    icon: <FileText className="h-6 w-6" />,
    format: 'pdf',
    sections: [
      'Executive Summary',
      'Property Description',
      'Market Analysis',
      'Valuation Methodology',
      'Comparable Properties',
      'Final Valuation & Recommendation',
      'Appendix'
    ],
    estimatedPages: '20-25',
    suitable: ['Commercial', 'Residential', 'Industrial']
  },
  {
    id: 'template-2',
    title: 'Market Analysis Report',
    description: 'In-depth analysis of market trends and property forecasts',
    icon: <FilePieChart className="h-6 w-6" />,
    format: 'pdf',
    sections: [
      'Executive Summary',
      'Market Overview',
      'Supply and Demand Analysis',
      'Price Trends',
      'Future Outlook',
      'Recommendations',
      'Data Sources'
    ],
    estimatedPages: '15-20',
    suitable: ['Market Research', 'Investment Analysis']
  },
  {
    id: 'template-3',
    title: 'Property Condition Assessment',
    description: 'Detailed assessment of property condition with recommendations',
    icon: <FileCode className="h-6 w-6" />,
    format: 'pdf',
    sections: [
      'Executive Summary',
      'Property Overview',
      'Structural Assessment',
      'Systems Assessment',
      'Code Compliance',
      'Recommendations',
      'Photo Documentation'
    ],
    estimatedPages: '25-30',
    suitable: ['Due Diligence', 'Renovations', 'Insurance']
  },
  {
    id: 'template-4',
    title: 'Investment Property Analysis',
    description: 'Financial analysis for investment properties with ROI projections',
    icon: <FileSpreadsheet className="h-6 w-6" />,
    format: 'xlsx',
    sections: [
      'Executive Summary',
      'Property Details',
      'Income Analysis',
      'Expense Analysis',
      'Cash Flow Projection',
      'ROI Calculation',
      'Sensitivity Analysis'
    ],
    estimatedPages: '10-15',
    suitable: ['Investment', 'Financial Planning']
  }
]

// Client and property mock data
const clients = [
  { id: 'c1', name: 'John Smith', company: 'Acme Properties' },
  { id: 'c2', name: 'Emily Johnson', company: 'Johnson Estates' },
  { id: 'c3', name: 'Michael Chen', company: '' },
  { id: 'c4', name: 'Sarah Williams', company: 'Williams Real Estate' }
]

const properties = [
  { id: 'p1', address: '500 Main Street, Metropolis, NY 10001', type: 'Commercial' },
  { id: 'p2', address: '200 Park Avenue, Metropolis, NY 10002', type: 'Commercial' },
  { id: 'p3', address: '150 Broadway, Metropolis, NY 10003', type: 'Residential' },
  { id: 'p4', address: '300 River Road, Metropolis, NY 10004', type: 'Industrial' }
]

export function ReportGenerator() {
  const { toast } = useToast()
  const [step, setStep] = useState(0)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [selectedProperty, setSelectedProperty] = useState<string>('')
  const [reportTitle, setReportTitle] = useState('')
  const [reportDescription, setReportDescription] = useState('')
  const [customizeOptions, setCustomizeOptions] = useState({
    includeExecutiveSummary: true,
    includeMarketAnalysis: true,
    includeComparables: true,
    includeAppendix: true,
    valuation: {
      method: 'income',
      confidenceLevel: 'medium'
    },
    sharing: {
      autoShare: false,
      password: false
    }
  })
  
  const handleNext = () => {
    if (step === 0 && !selectedTemplate) {
      toast({
        title: "Please Select a Template",
        description: "You must select a report template to continue",
        variant: "destructive"
      })
      return
    }
    
    if (step === 1 && (!selectedClient || !selectedProperty)) {
      toast({
        title: "Missing Information",
        description: "Please select both a client and property",
        variant: "destructive"
      })
      return
    }
    
    if (step === 2 && (!reportTitle || !reportDescription)) {
      toast({
        title: "Missing Information",
        description: "Please provide a title and description for the report",
        variant: "destructive"
      })
      return
    }
    
    if (step < 3) {
      setStep(step + 1)
    } else {
      // Generate report
      console.log('Generating report with:', {
        template: selectedTemplate,
        client: selectedClient,
        property: selectedProperty,
        title: reportTitle,
        description: reportDescription,
        options: customizeOptions
      })
      
      toast({
        title: "Report Generation Started",
        description: "Your report is being generated and will be available shortly",
      })
    }
  }
  
  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1)
    } else {
      // Navigate back to reports list
      console.log('Navigate back to reports list')
      toast({
        title: "Navigation",
        description: "Returning to reports list",
      })
    }
  }
  
  const getSelectedTemplate = () => {
    return reportTemplates.find(template => template.id === selectedTemplate)
  }
  
  const getSelectedClient = () => {
    return clients.find(client => client.id === selectedClient)
  }
  
  const getSelectedProperty = () => {
    return properties.find(property => property.id === selectedProperty)
  }
  
  // Calculate estimated generation time based on template and options
  const getEstimatedTime = () => {
    const template = getSelectedTemplate()
    if (!template) return '5-10 minutes'
    
    // Simple logic to estimate time based on template and options
    const baseTime = template.id === 'template-4' ? 5 : 10 // Investment report is quicker
    let additionalTime = 0
    
    if (customizeOptions.includeMarketAnalysis) additionalTime += 3
    if (customizeOptions.includeComparables) additionalTime += 2
    if (customizeOptions.includeAppendix) additionalTime += 1
    
    return `${baseTime}-${baseTime + additionalTime} minutes`
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {step === 0 ? 'Back to Reports' : 'Previous Step'}
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
          <CardDescription>
            Create a new property report using our templates and customization options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Steps currentStep={step} totalSteps={4} className="mb-6">
            <Step title="Select Template" step={1} />
            <Step title="Select Client & Property" step={2} />
            <Step title="Report Details" step={3} />
            <Step title="Customize & Generate" step={4} />
          </Steps>
          
          {/* Step 1: Select Template */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportTemplates.map((template) => (
                  <div 
                    key={template.id}
                    className={`
                      rounded-lg border p-4 cursor-pointer transition-all
                      ${selectedTemplate === template.id ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/20'}
                    `}
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="rounded-md bg-muted p-2">
                          {template.icon}
                        </div>
                        <div>
                          <h3 className="font-medium">{template.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {template.description}
                          </p>
                        </div>
                      </div>
                      {selectedTemplate === template.id && (
                        <div className="rounded-full bg-primary text-white p-1">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">{template.format.toUpperCase()}</Badge>
                      <Badge variant="outline" className="text-xs">{template.estimatedPages} pages</Badge>
                    </div>
                    <div className="mt-2">
                      <h4 className="text-xs font-medium text-muted-foreground">Suitable for:</h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {template.suitable.map((item, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">{item}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {selectedTemplate && (
                <div className="rounded-lg border p-4 mt-6">
                  <h3 className="font-medium mb-2">Template Details: {getSelectedTemplate()?.title}</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Sections Included</h4>
                      <ul className="mt-2 space-y-1">
                        {getSelectedTemplate()?.sections.map((section, index) => (
                          <li key={index} className="text-sm flex items-center gap-2">
                            <Check className="h-3 w-3 text-green-500" />
                            {section}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Step 2: Select Client & Property */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Select Client</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {clients.map((client) => (
                    <div 
                      key={client.id}
                      className={`
                        rounded-lg border p-4 cursor-pointer transition-all
                        ${selectedClient === client.id ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/20'}
                      `}
                      onClick={() => setSelectedClient(client.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">{client.name}</h3>
                          {client.company && (
                            <p className="text-sm text-muted-foreground">
                              {client.company}
                            </p>
                          )}
                        </div>
                        {selectedClient === client.id && (
                          <div className="rounded-full bg-primary text-white p-1">
                            <Check className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-4">Select Property</h3>
                <div className="grid grid-cols-1 gap-3">
                  {properties.map((property) => (
                    <div 
                      key={property.id}
                      className={`
                        rounded-lg border p-4 cursor-pointer transition-all
                        ${selectedProperty === property.id ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/20'}
                      `}
                      onClick={() => setSelectedProperty(property.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">{property.address}</h3>
                          <Badge variant="outline" className="text-xs mt-1">{property.type}</Badge>
                        </div>
                        {selectedProperty === property.id && (
                          <div className="rounded-full bg-primary text-white p-1">
                            <Check className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Step 3: Report Details */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Report Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter report title"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Report Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter a description of the report's purpose and scope"
                    className="min-h-[100px]"
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="rounded-lg border p-4 mt-4">
                <h3 className="font-medium mb-4">Report Summary</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Template</h4>
                      <p>{getSelectedTemplate()?.title}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Client</h4>
                      <p>{getSelectedClient()?.name}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Property</h4>
                      <p>{getSelectedProperty()?.address}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Expected Format</h4>
                      <p>{getSelectedTemplate()?.format.toUpperCase()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 4: Customize & Generate */}
          {step === 3 && (
            <div className="space-y-6">
              <Tabs defaultValue="content" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="valuation">Valuation</TabsTrigger>
                  <TabsTrigger value="sharing">Sharing</TabsTrigger>
                </TabsList>
                
                <TabsContent value="content" className="space-y-4 pt-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Content Options</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="executive-summary" 
                          checked={customizeOptions.includeExecutiveSummary}
                          onCheckedChange={(checked) => 
                            setCustomizeOptions({
                              ...customizeOptions,
                              includeExecutiveSummary: checked as boolean
                            })
                          }
                        />
                        <Label htmlFor="executive-summary">Include Executive Summary</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="market-analysis" 
                          checked={customizeOptions.includeMarketAnalysis}
                          onCheckedChange={(checked) => 
                            setCustomizeOptions({
                              ...customizeOptions,
                              includeMarketAnalysis: checked as boolean
                            })
                          }
                        />
                        <Label htmlFor="market-analysis">Include Market Analysis</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="comparables" 
                          checked={customizeOptions.includeComparables}
                          onCheckedChange={(checked) => 
                            setCustomizeOptions({
                              ...customizeOptions,
                              includeComparables: checked as boolean
                            })
                          }
                        />
                        <Label htmlFor="comparables">Include Comparable Properties</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="appendix" 
                          checked={customizeOptions.includeAppendix}
                          onCheckedChange={(checked) => 
                            setCustomizeOptions({
                              ...customizeOptions,
                              includeAppendix: checked as boolean
                            })
                          }
                        />
                        <Label htmlFor="appendix">Include Appendix with Data Sources</Label>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="valuation" className="space-y-4 pt-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Valuation Options</h3>
                    
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">Valuation Method</h4>
                      <RadioGroup 
                        value={customizeOptions.valuation.method}
                        onValueChange={(value) => 
                          setCustomizeOptions({
                            ...customizeOptions,
                            valuation: {
                              ...customizeOptions.valuation,
                              method: value
                            }
                          })
                        }
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="income" id="income" />
                          <Label htmlFor="income">Income Approach</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="sales" id="sales" />
                          <Label htmlFor="sales">Sales Comparison Approach</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="cost" id="cost" />
                          <Label htmlFor="cost">Cost Approach</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    <div className="space-y-3 mt-4">
                      <h4 className="text-sm font-medium">Confidence Level</h4>
                      <RadioGroup 
                        value={customizeOptions.valuation.confidenceLevel}
                        onValueChange={(value) => 
                          setCustomizeOptions({
                            ...customizeOptions,
                            valuation: {
                              ...customizeOptions.valuation,
                              confidenceLevel: value
                            }
                          })
                        }
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="high" id="high" />
                          <Label htmlFor="high">High (Extensive market data available)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="medium" id="medium" />
                          <Label htmlFor="medium">Medium (Standard market data)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="low" id="low" />
                          <Label htmlFor="low">Low (Limited market data)</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="sharing" className="space-y-4 pt-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Sharing Options</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                          <Label htmlFor="auto-share">Auto-share with client</Label>
                          <p className="text-sm text-muted-foreground">
                            Automatically share the report with the selected client when complete
                          </p>
                        </div>
                        <Switch 
                          id="auto-share"
                          checked={customizeOptions.sharing.autoShare}
                          onCheckedChange={(checked) => 
                            setCustomizeOptions({
                              ...customizeOptions,
                              sharing: {
                                ...customizeOptions.sharing,
                                autoShare: checked
                              }
                            })
                          }
                        />
                      </div>
                      
                      <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-0.5">
                          <Label htmlFor="password-protect">Password protect document</Label>
                          <p className="text-sm text-muted-foreground">
                            Add password protection to the report for additional security
                          </p>
                        </div>
                        <Switch 
                          id="password-protect"
                          checked={customizeOptions.sharing.password}
                          onCheckedChange={(checked) => 
                            setCustomizeOptions({
                              ...customizeOptions,
                              sharing: {
                                ...customizeOptions.sharing,
                                password: checked
                              }
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="rounded-lg border p-4 mt-4 bg-muted/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Ready to Generate</h3>
                    <p className="text-sm text-muted-foreground">
                      {reportTitle || "Your report"} will be generated with the selected options
                    </p>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Clock className="h-4 w-4 mr-2" />
                    <span className="text-sm">Estimated time: {getEstimatedTime()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={handleBack}
          >
            {step === 0 ? 'Cancel' : 'Back'}
          </Button>
          <Button onClick={handleNext}>
            {step < 3 ? (
              <>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Generate Report
                <FileText className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 