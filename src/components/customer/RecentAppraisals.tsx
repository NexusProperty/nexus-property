import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { ArrowUpRight, ChevronRight, Wallet, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Example appraisal data type
interface Appraisal {
  id: string;
  propertyId: string;
  propertyAddress: string;
  status: string;
  date: Date;
  value: number;
  previousValue?: number;
  changePercentage?: number;
  agent?: {
    name: string;
    avatar: string;
  };
}

interface RecentAppraisalsProps {
  appraisals: Appraisal[];
}

const RecentAppraisals: React.FC<RecentAppraisalsProps> = ({ appraisals }) => {
  // Function to determine status badge color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in progress':
        return 'bg-blue-100 text-blue-800';
      case 'scheduled':
        return 'bg-purple-100 text-purple-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Function to format value change
  const formatValueChange = (appraisal: Appraisal) => {
    if (!appraisal.previousValue || !appraisal.changePercentage) return null;
    
    const isIncrease = appraisal.changePercentage > 0;
    
    return (
      <div className={`flex items-center ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
        <ArrowUpRight className={`h-4 w-4 mr-1 ${!isIncrease ? 'transform rotate-180' : ''}`} />
        <span>{Math.abs(appraisal.changePercentage).toFixed(1)}% from last appraisal</span>
      </div>
    );
  };

  if (appraisals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Appraisals</CardTitle>
          <CardDescription>View your latest property appraisals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Wallet className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No recent appraisals</h3>
            <p className="mt-1 text-sm text-gray-500">You don't have any recent appraisals.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Appraisals</CardTitle>
          <CardDescription>View your latest property appraisals</CardDescription>
        </div>
        <Button variant="ghost" size="sm" className="text-sm">
          View all <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {appraisals.map((appraisal) => (
            <div 
              key={appraisal.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="space-y-1 mb-2 sm:mb-0">
                <div className="flex items-center">
                  <h4 className="font-medium">{appraisal.propertyAddress}</h4>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 ml-1 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        Appraisals are conducted by certified professionals based on market analysis and property condition.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(appraisal.status)}>
                    {appraisal.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(appraisal.date, { addSuffix: true })}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-base">
                  ${appraisal.value.toLocaleString()}
                </div>
                {formatValueChange(appraisal)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentAppraisals; 