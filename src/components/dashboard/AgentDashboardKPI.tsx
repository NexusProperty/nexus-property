import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { ArrowDownIcon, ArrowUpIcon, DollarSign, Home, TrendingUp, Users } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  description: string;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  icon: React.ReactNode;
  color?: string;
}

const KPICard: React.FC<KPICardProps> = ({ 
  title, 
  value, 
  description, 
  change, 
  icon,
  color = 'bg-primary/10' 
}) => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className={`rounded-full p-2 ${color}`}>
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center pt-1">
          {change && (
            <span className={`mr-2 flex items-center text-xs ${change.type === 'increase' ? 'text-green-500' : 'text-red-500'}`}>
              {change.type === 'increase' ? <ArrowUpIcon className="mr-1 h-3 w-3" /> : <ArrowDownIcon className="mr-1 h-3 w-3" />}
              {change.value}%
            </span>
          )}
          <CardDescription className="text-xs">{description}</CardDescription>
        </div>
      </CardContent>
    </Card>
  );
};

export const AgentDashboardKPI: React.FC = () => {
  // In a real application, these values would come from an API
  const kpiData = [
    {
      title: 'Completed Appraisals',
      value: 24,
      description: 'vs. last 30 days',
      change: { value: 12, type: 'increase' as const },
      icon: <Home className="h-4 w-4 text-primary" />,
      color: 'bg-primary/10'
    },
    {
      title: 'Avg. Valuation',
      value: '$425,000',
      description: 'vs. last 30 days',
      change: { value: 8, type: 'increase' as const },
      icon: <DollarSign className="h-4 w-4 text-green-500" />,
      color: 'bg-green-500/10'
    },
    {
      title: 'Active Clients',
      value: 18,
      description: '3 new this month',
      change: { value: 5, type: 'increase' as const },
      icon: <Users className="h-4 w-4 text-blue-500" />,
      color: 'bg-blue-500/10'
    },
    {
      title: 'Market Activity',
      value: 'High',
      description: 'Trending upward',
      icon: <TrendingUp className="h-4 w-4 text-orange-500" />,
      color: 'bg-orange-500/10'
    }
  ];

  // Monthly target data
  const targetData = {
    currentValue: 24,
    targetValue: 30,
    percentage: (24 / 30) * 100
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Monthly Targets</CardTitle>
          <CardDescription>
            {targetData.currentValue} of {targetData.targetValue} appraisals completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={targetData.percentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <div>0</div>
            <div>{targetData.targetValue}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentDashboardKPI; 