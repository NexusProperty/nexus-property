import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { 
  FileText, 
  Home, 
  Plus, 
  Search, 
  User, 
  FileSpreadsheet,
  PieChart,
  Calendar
} from 'lucide-react';

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost';
}

const QuickAction: React.FC<QuickActionProps> = ({ 
  icon, 
  label, 
  onClick, 
  variant = 'outline' 
}) => {
  return (
    <Button
      variant={variant}
      className="flex flex-col h-24 w-full items-center justify-center gap-2 rounded-xl"
      onClick={onClick}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </Button>
  );
};

export const QuickActions: React.FC = () => {
  // In a real application, these would trigger actual navigation or actions
  const handleAction = (action: string) => {
    console.log(`Action triggered: ${action}`);
    // Would typically navigate or open a modal here
  };

  const actions = [
    {
      icon: <Plus className="h-5 w-5" />,
      label: 'New Appraisal',
      onClick: () => handleAction('new-appraisal'),
      variant: 'default' as const
    },
    {
      icon: <Home className="h-5 w-5" />,
      label: 'Add Property',
      onClick: () => handleAction('add-property'),
    },
    {
      icon: <User className="h-5 w-5" />,
      label: 'Add Client',
      onClick: () => handleAction('add-client'),
    },
    {
      icon: <Search className="h-5 w-5" />,
      label: 'Market Research',
      onClick: () => handleAction('market-research'),
    },
    {
      icon: <FileText className="h-5 w-5" />,
      label: 'New Report',
      onClick: () => handleAction('new-report'),
    },
    {
      icon: <FileSpreadsheet className="h-5 w-5" />,
      label: 'Export Data',
      onClick: () => handleAction('export-data'),
    },
    {
      icon: <PieChart className="h-5 w-5" />,
      label: 'Analytics',
      onClick: () => handleAction('analytics'),
    },
    {
      icon: <Calendar className="h-5 w-5" />,
      label: 'Schedule',
      onClick: () => handleAction('schedule'),
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Frequently used tools and shortcuts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {actions.map((action, index) => (
            <QuickAction
              key={index}
              icon={action.icon}
              label={action.label}
              onClick={action.onClick}
              variant={action.variant}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions; 