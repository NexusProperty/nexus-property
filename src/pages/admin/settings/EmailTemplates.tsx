import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Copy,
  Eye,
  Save,
  FileText,
  Mail
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  type: 'notification' | 'transactional' | 'marketing';
  content: string;
  variables: string[];
  active: boolean;
  lastUpdated: string;
}

const mockEmailTemplates: EmailTemplate[] = [
  {
    id: 'welcome-email',
    name: 'Welcome Email',
    subject: 'Welcome to AppraisalHub - Get Started Today!',
    type: 'transactional',
    content: `<p>Dear {{firstName}},</p>
<p>Welcome to AppraisalHub! We're thrilled to have you join us.</p>
<p>Here's what you can do to get started:</p>
<ul>
  <li>Complete your profile information</li>
  <li>Explore the dashboard</li>
  <li>Add your first property</li>
</ul>
<p>If you have any questions, our support team is here to help.</p>
<p>Best regards,<br>The AppraisalHub Team</p>`,
    variables: ['firstName', 'email', 'accountType'],
    active: true,
    lastUpdated: '2023-09-15'
  },
  {
    id: 'password-reset',
    name: 'Password Reset',
    subject: 'Reset Your AppraisalHub Password',
    type: 'transactional',
    content: `<p>Hello {{firstName}},</p>
<p>We received a request to reset your password for AppraisalHub.</p>
<p>To reset your password, please click the link below:</p>
<p><a href="{{resetLink}}">Reset Password</a></p>
<p>This link will expire in 24 hours.</p>
<p>If you didn't request this reset, you can safely ignore this email.</p>
<p>Regards,<br>AppraisalHub Security Team</p>`,
    variables: ['firstName', 'resetLink', 'supportEmail'],
    active: true,
    lastUpdated: '2023-08-22'
  },
  {
    id: 'appraisal-complete',
    name: 'Appraisal Complete',
    subject: 'Your Property Appraisal is Complete',
    type: 'notification',
    content: `<p>Dear {{clientName}},</p>
<p>We're pleased to inform you that the appraisal for your property at {{propertyAddress}} has been completed.</p>
<p>You can view the full report by logging into your account and visiting the property details page.</p>
<p>Here's a summary of the appraisal:</p>
<ul>
  <li>Property: {{propertyAddress}}</li>
  <li>Appraised Value: {{appraisedValue}}</li>
  <li>Appraisal Date: {{appraisalDate}}</li>
</ul>
<p>If you have any questions about the report, please contact your agent at {{agentEmail}}.</p>
<p>Thank you for choosing AppraisalHub,<br>The AppraisalHub Team</p>`,
    variables: ['clientName', 'propertyAddress', 'appraisedValue', 'appraisalDate', 'agentEmail'],
    active: true,
    lastUpdated: '2023-10-01'
  },
  {
    id: 'monthly-newsletter',
    name: 'Monthly Newsletter',
    subject: 'AppraisalHub Monthly Insights - {{month}} {{year}}',
    type: 'marketing',
    content: `<p>Hello {{firstName}},</p>
<p>Here are this month's real estate market insights and updates:</p>
<h3>Market Trends</h3>
<p>{{marketTrendsSummary}}</p>
<h3>New Features</h3>
<p>{{newFeaturesList}}</p>
<h3>Tips & Advice</h3>
<p>{{tipsContent}}</p>
<p>We hope you find these insights valuable!</p>
<p>Best regards,<br>The AppraisalHub Team</p>
<p><small>You can <a href="{{unsubscribeLink}}">unsubscribe</a> from these emails at any time.</small></p>`,
    variables: ['firstName', 'month', 'year', 'marketTrendsSummary', 'newFeaturesList', 'tipsContent', 'unsubscribeLink'],
    active: false,
    lastUpdated: '2023-09-25'
  },
  {
    id: 'new-property-alert',
    name: 'New Property Alert',
    subject: 'New Property Added to Your Account',
    type: 'notification',
    content: `<p>Hello {{firstName}},</p>
<p>A new property has been added to your account with the following details:</p>
<ul>
  <li>Address: {{propertyAddress}}</li>
  <li>Type: {{propertyType}}</li>
  <li>Added on: {{addedDate}}</li>
</ul>
<p>You can view and edit this property details by logging into your account.</p>
<p>Thank you,<br>AppraisalHub Team</p>`,
    variables: ['firstName', 'propertyAddress', 'propertyType', 'addedDate'],
    active: true,
    lastUpdated: '2023-08-15'
  }
];

const EmailTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>(mockEmailTemplates);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  
  // Filter templates based on search term and selected type
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      template.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === 'all' || template.type === selectedType;
    
    return matchesSearch && matchesType;
  });

  const handleAddNewTemplate = () => {
    const newTemplate: EmailTemplate = {
      id: `template-${Date.now()}`,
      name: 'New Template',
      subject: 'New Email Subject',
      type: 'notification',
      content: '<p>Enter your email content here...</p>',
      variables: [],
      active: false,
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    
    setSelectedTemplate(newTemplate);
    setIsEditing(true);
    setDialogOpen(true);
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setSelectedTemplate({...template});
    setIsEditing(true);
    setPreviewMode(false);
    setDialogOpen(true);
  };

  const handlePreviewTemplate = (template: EmailTemplate) => {
    setSelectedTemplate({...template});
    setIsEditing(false);
    setPreviewMode(true);
    setDialogOpen(true);
  };

  const handleDeleteTemplate = (id: string) => {
    // In a real application, this would call an API to delete the template
    setTemplates(prevTemplates => prevTemplates.filter(t => t.id !== id));
    toast({
      title: "Template deleted",
      description: "The email template has been removed successfully.",
    });
  };

  const handleDuplicateTemplate = (template: EmailTemplate) => {
    const duplicatedTemplate: EmailTemplate = {
      ...template,
      id: `${template.id}-copy-${Date.now()}`,
      name: `${template.name} (Copy)`,
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    
    setTemplates(prevTemplates => [...prevTemplates, duplicatedTemplate]);
    toast({
      title: "Template duplicated",
      description: "A copy of the template has been created."
    });
  };

  const handleSaveTemplate = () => {
    if (!selectedTemplate) return;
    
    if (templates.some(t => t.id === selectedTemplate.id)) {
      // Update existing template
      setTemplates(prevTemplates => 
        prevTemplates.map(t => 
          t.id === selectedTemplate.id ? {...selectedTemplate, lastUpdated: new Date().toISOString().split('T')[0]} : t
        )
      );
    } else {
      // Add new template
      setTemplates(prevTemplates => [...prevTemplates, {...selectedTemplate, lastUpdated: new Date().toISOString().split('T')[0]}]);
    }
    
    setDialogOpen(false);
    toast({
      title: "Template saved",
      description: "The email template has been saved successfully."
    });
  };

  const handleFieldChange = (field: keyof EmailTemplate, value: string | boolean) => {
    if (!selectedTemplate) return;
    
    setSelectedTemplate({
      ...selectedTemplate,
      [field]: value
    });
  };

  const handleVariableChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!selectedTemplate) return;
    
    // Split the textarea content by commas, lines, or spaces and filter out empty strings
    const variables = event.target.value
      .split(/[\n,\s]+/)
      .map(v => v.trim())
      .filter(v => v !== '');
    
    setSelectedTemplate({
      ...selectedTemplate,
      variables
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Email Templates</h1>
          <p className="text-muted-foreground">
            Manage email templates for various system notifications and communications
          </p>
        </div>
        <Button onClick={handleAddNewTemplate}>
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="notification">Notification</SelectItem>
            <SelectItem value="transactional">Transactional</SelectItem>
            <SelectItem value="marketing">Marketing</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email Templates</CardTitle>
          <CardDescription>
            {filteredTemplates.length} templates found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTemplates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell className="max-w-[250px] truncate">{template.subject}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium 
                      ${template.type === 'notification' ? 'bg-blue-100 text-blue-800' : ''}
                      ${template.type === 'transactional' ? 'bg-green-100 text-green-800' : ''}
                      ${template.type === 'marketing' ? 'bg-purple-100 text-purple-800' : ''}
                    `}>
                      {template.type.charAt(0).toUpperCase() + template.type.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      template.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {template.active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>{template.lastUpdated}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handlePreviewTemplate(template)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleEditTemplate(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDuplicateTemplate(template)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredTemplates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    No templates found. Try adjusting your search or filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {isEditing ? (
                <>
                  <FileText className="mr-2 h-5 w-5" /> 
                  {selectedTemplate?.id.includes('template-') ? 'Create New Template' : 'Edit Template'}
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-5 w-5" /> 
                  Preview Template: {selectedTemplate?.name}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? "Customize the template's content, subject line, and settings." 
                : "This is how your email will appear to recipients."}
            </DialogDescription>
          </DialogHeader>

          {selectedTemplate && (
            <>
              {isEditing ? (
                <Tabs defaultValue="content" className="flex-1 overflow-hidden flex flex-col">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="variables">Variables</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="content" className="flex-1 overflow-hidden flex flex-col">
                    <div className="space-y-4 mb-4">
                      <div>
                        <Label htmlFor="template-subject">Email Subject</Label>
                        <Input
                          id="template-subject"
                          value={selectedTemplate.subject}
                          onChange={(e) => handleFieldChange('subject', e.target.value)}
                        />
                      </div>
                      
                      <div className="flex-1">
                        <Label htmlFor="template-content">Email Content (HTML)</Label>
                        <Textarea
                          id="template-content"
                          value={selectedTemplate.content}
                          onChange={(e) => handleFieldChange('content', e.target.value)}
                          className="h-[300px] font-mono text-sm"
                        />
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="variables" className="space-y-4">
                    <div>
                      <Label htmlFor="template-variables">Template Variables</Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Enter variable names (one per line) that can be used in this template.
                        These will be replaced with actual values when the email is sent.
                      </p>
                      <Textarea
                        id="template-variables"
                        value={selectedTemplate.variables.join('\n')}
                        onChange={handleVariableChange}
                        className="h-[200px] font-mono text-sm"
                        placeholder="firstName&#10;email&#10;companyName"
                      />
                    </div>
                    
                    <div>
                      <Label>Available Variables</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedTemplate.variables.map((variable) => (
                          <div key={variable} className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                            {`{{${variable}}}`}
                          </div>
                        ))}
                        {selectedTemplate.variables.length === 0 && (
                          <p className="text-sm text-muted-foreground">No variables defined yet.</p>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="settings" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="template-name">Template Name</Label>
                        <Input
                          id="template-name"
                          value={selectedTemplate.name}
                          onChange={(e) => handleFieldChange('name', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="template-type">Template Type</Label>
                        <Select 
                          value={selectedTemplate.type} 
                          onValueChange={(value) => handleFieldChange('type', value)}
                        >
                          <SelectTrigger id="template-type">
                            <SelectValue placeholder="Select template type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="notification">Notification</SelectItem>
                            <SelectItem value="transactional">Transactional</SelectItem>
                            <SelectItem value="marketing">Marketing</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="template-active" className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          id="template-active"
                          checked={selectedTemplate.active}
                          onChange={(e) => handleFieldChange('active', e.target.checked)}
                          className="form-checkbox h-4 w-4"
                        />
                        <span>Active</span>
                        <span className="text-sm text-muted-foreground">
                          (Inactive templates will not be sent by the system)
                        </span>
                      </Label>
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="flex-1 overflow-hidden flex flex-col">
                  <div className="bg-gray-50 p-4 rounded-md mb-4">
                    <div className="font-medium">Subject: {selectedTemplate.subject}</div>
                  </div>
                  
                  <div className="border rounded-md p-6 flex-1 overflow-y-auto bg-white">
                    <div dangerouslySetInnerHTML={{ __html: selectedTemplate.content }} />
                  </div>
                  
                  {selectedTemplate.variables.length > 0 && (
                    <div className="mt-4">
                      <Label>Template Variables</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedTemplate.variables.map((variable) => (
                          <div key={variable} className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                            {`{{${variable}}}`}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <DialogFooter>
                {isEditing ? (
                  <>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveTemplate}>
                      <Save className="mr-2 h-4 w-4" />
                      Save Template
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Close
                    </Button>
                    <Button onClick={() => {
                      setIsEditing(true);
                      setPreviewMode(false);
                    }}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Template
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmailTemplates; 