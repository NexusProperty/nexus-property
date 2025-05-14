import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Save, Settings, RefreshCw } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface FeatureToggle {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: 'core' | 'experimental' | 'beta';
}

interface SystemSetting {
  id: string;
  name: string;
  value: string;
  type: 'text' | 'number' | 'select';
  options?: string[];
  category: 'general' | 'security' | 'performance';
}

const mockFeatureToggles: FeatureToggle[] = [
  {
    id: 'advanced_analytics',
    name: 'Advanced Analytics',
    description: 'Enable AI-powered analytics and market predictions',
    enabled: true,
    category: 'core'
  },
  {
    id: 'automated_valuations',
    name: 'Automated Valuations',
    description: 'Allow system to generate automated property valuations',
    enabled: true,
    category: 'core'
  },
  {
    id: 'customer_portal',
    name: 'Customer Portal',
    description: 'Enable access to customer-facing portal features',
    enabled: true,
    category: 'core'
  },
  {
    id: 'bulk_imports',
    name: 'Bulk Property Imports',
    description: 'Allow importing multiple properties from CSV/Excel files',
    enabled: false,
    category: 'beta'
  },
  {
    id: 'map_integration',
    name: 'Interactive Map Integration',
    description: 'Show properties and comparables on interactive maps',
    enabled: true,
    category: 'beta'
  },
  {
    id: 'ai_suggestions',
    name: 'AI Improvement Suggestions',
    description: 'AI-generated suggestions for property value improvements',
    enabled: false,
    category: 'experimental'
  },
  {
    id: 'realtime_chat',
    name: 'Real-time Customer Chat',
    description: 'Enable real-time chat between agents and customers',
    enabled: false,
    category: 'experimental'
  }
];

const mockSystemSettings: SystemSetting[] = [
  {
    id: 'session_timeout',
    name: 'Session Timeout (minutes)',
    value: '30',
    type: 'number',
    category: 'security'
  },
  {
    id: 'default_currency',
    name: 'Default Currency',
    value: 'USD',
    type: 'select',
    options: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
    category: 'general'
  },
  {
    id: 'date_format',
    name: 'Date Format',
    value: 'MM/DD/YYYY',
    type: 'select',
    options: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'],
    category: 'general'
  },
  {
    id: 'cache_duration',
    name: 'Cache Duration (hours)',
    value: '24',
    type: 'number',
    category: 'performance'
  },
  {
    id: 'max_upload_size',
    name: 'Maximum Upload Size (MB)',
    value: '10',
    type: 'number',
    category: 'performance'
  },
  {
    id: 'support_email',
    name: 'Support Email',
    value: 'support@appraisalhub.com',
    type: 'text',
    category: 'general'
  }
];

const ApplicationSettings: React.FC = () => {
  const [featureToggles, setFeatureToggles] = useState<FeatureToggle[]>(mockFeatureToggles);
  const [systemSettings, setSystemSettings] = useState<SystemSetting[]>(mockSystemSettings);
  const [activeTab, setActiveTab] = useState('features');
  
  const handleFeatureToggle = (id: string, enabled: boolean) => {
    setFeatureToggles(prevToggles => 
      prevToggles.map(toggle => 
        toggle.id === id ? { ...toggle, enabled } : toggle
      )
    );
  };

  const handleSettingChange = (id: string, value: string) => {
    setSystemSettings(prevSettings => 
      prevSettings.map(setting => 
        setting.id === id ? { ...setting, value } : setting
      )
    );
  };

  const handleSaveSettings = () => {
    // In a real application, this would send the data to the server
    console.log('Saving settings:', { featureToggles, systemSettings });
    toast({
      title: "Settings saved",
      description: "Your application settings have been updated successfully.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Application Settings</h1>
          <p className="text-muted-foreground">
            Manage system-wide settings and feature toggles
          </p>
        </div>
        <Button onClick={handleSaveSettings}>
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="features">Feature Toggles</TabsTrigger>
          <TabsTrigger value="settings">System Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="features" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Card className="col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Core Features</CardTitle>
                <CardDescription>Essential system functionality</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-2">
                  {featureToggles.filter(f => f.category === 'core').length} features
                </div>
              </CardContent>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Beta Features</CardTitle>
                <CardDescription>Nearly ready for production</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-2">
                  {featureToggles.filter(f => f.category === 'beta').length} features
                </div>
              </CardContent>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Experimental</CardTitle>
                <CardDescription>Early development features</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-2">
                  {featureToggles.filter(f => f.category === 'experimental').length} features
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Feature Configuration</CardTitle>
              <CardDescription>
                Enable or disable system features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {featureToggles.map((feature) => (
                <React.Fragment key={feature.id}>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center">
                        <Label htmlFor={feature.id} className="text-base font-medium">
                          {feature.name}
                        </Label>
                        {feature.category === 'experimental' && (
                          <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                            Experimental
                          </span>
                        )}
                        {feature.category === 'beta' && (
                          <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            Beta
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                    <Switch
                      id={feature.id}
                      checked={feature.enabled}
                      onCheckedChange={(checked) => handleFeatureToggle(feature.id, checked)}
                    />
                  </div>
                  <Separator className="my-4" />
                </React.Fragment>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Basic configuration for the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {systemSettings
                .filter(setting => setting.category === 'general')
                .map((setting) => (
                  <div key={setting.id} className="grid grid-cols-2 gap-4 items-center">
                    <Label htmlFor={setting.id} className="text-right">
                      {setting.name}
                    </Label>
                    {setting.type === 'select' ? (
                      <Select 
                        value={setting.value} 
                        onValueChange={(value) => handleSettingChange(setting.id, value)}
                      >
                        <SelectTrigger id={setting.id}>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {setting.options?.map(option => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id={setting.id}
                        type={setting.type}
                        value={setting.value}
                        onChange={(e) => handleSettingChange(setting.id, e.target.value)}
                      />
                    )}
                  </div>
                ))}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure security-related settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {systemSettings
                .filter(setting => setting.category === 'security')
                .map((setting) => (
                  <div key={setting.id} className="grid grid-cols-2 gap-4 items-center">
                    <Label htmlFor={setting.id} className="text-right">
                      {setting.name}
                    </Label>
                    {setting.type === 'select' ? (
                      <Select 
                        value={setting.value} 
                        onValueChange={(value) => handleSettingChange(setting.id, value)}
                      >
                        <SelectTrigger id={setting.id}>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {setting.options?.map(option => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id={setting.id}
                        type={setting.type}
                        value={setting.value}
                        onChange={(e) => handleSettingChange(setting.id, e.target.value)}
                      />
                    )}
                  </div>
                ))}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Performance Settings</CardTitle>
              <CardDescription>
                Configure settings that affect system performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {systemSettings
                .filter(setting => setting.category === 'performance')
                .map((setting) => (
                  <div key={setting.id} className="grid grid-cols-2 gap-4 items-center">
                    <Label htmlFor={setting.id} className="text-right">
                      {setting.name}
                    </Label>
                    {setting.type === 'select' ? (
                      <Select 
                        value={setting.value} 
                        onValueChange={(value) => handleSettingChange(setting.id, value)}
                      >
                        <SelectTrigger id={setting.id}>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {setting.options?.map(option => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id={setting.id}
                        type={setting.type}
                        value={setting.value}
                        onChange={(e) => handleSettingChange(setting.id, e.target.value)}
                      />
                    )}
                  </div>
                ))}
            </CardContent>
          </Card>
          
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset to Defaults
            </Button>
            <Button onClick={handleSaveSettings}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApplicationSettings; 