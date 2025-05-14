import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { 
  ArrowUpRight, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  RefreshCw, 
  XCircle 
} from 'lucide-react';

type AppraisalStatus = 'draft' | 'in_progress' | 'pending_review' | 'completed' | 'cancelled';

interface Appraisal {
  id: string;
  propertyAddress: string;
  clientName: string;
  valuation: string;
  status: AppraisalStatus;
  date: string;
  confidence: 'high' | 'medium' | 'low';
}

const getStatusBadge = (status: AppraisalStatus) => {
  switch (status) {
    case 'draft':
      return <Badge variant="outline" className="border-slate-200 bg-slate-100 text-slate-800">Draft</Badge>;
    case 'in_progress':
      return <Badge variant="outline" className="border-blue-200 bg-blue-100 text-blue-800">In Progress</Badge>;
    case 'pending_review':
      return <Badge variant="outline" className="border-amber-200 bg-amber-100 text-amber-800">Pending Review</Badge>;
    case 'completed':
      return <Badge variant="outline" className="border-green-200 bg-green-100 text-green-800">Completed</Badge>;
    case 'cancelled':
      return <Badge variant="outline" className="border-red-200 bg-red-100 text-red-800">Cancelled</Badge>;
  }
};

const getStatusIcon = (status: AppraisalStatus) => {
  switch (status) {
    case 'draft':
      return <Clock className="h-4 w-4 text-slate-500" />;
    case 'in_progress':
      return <RefreshCw className="h-4 w-4 text-blue-500" />;
    case 'pending_review':
      return <AlertCircle className="h-4 w-4 text-amber-500" />;
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'cancelled':
      return <XCircle className="h-4 w-4 text-red-500" />;
  }
};

const getConfidenceBadge = (confidence: 'high' | 'medium' | 'low') => {
  switch (confidence) {
    case 'high':
      return <Badge variant="outline" className="border-green-200 bg-green-100 text-green-800">High Confidence</Badge>;
    case 'medium':
      return <Badge variant="outline" className="border-amber-200 bg-amber-100 text-amber-800">Medium Confidence</Badge>;
    case 'low':
      return <Badge variant="outline" className="border-red-200 bg-red-100 text-red-800">Low Confidence</Badge>;
  }
};

const AppraisalItem: React.FC<{ appraisal: Appraisal }> = ({ appraisal }) => {
  const formattedDate = new Date(appraisal.date).toLocaleDateString('en-US', { 
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon(appraisal.status)}
          <span className="font-medium">{appraisal.propertyAddress}</span>
        </div>
        {getStatusBadge(appraisal.status)}
      </div>
      <div className="grid grid-cols-2 gap-1 text-sm">
        <div className="text-muted-foreground">Client:</div>
        <div className="font-medium">{appraisal.clientName}</div>
        <div className="text-muted-foreground">Valuation:</div>
        <div className="font-medium">{appraisal.valuation}</div>
        <div className="text-muted-foreground">Date:</div>
        <div>{formattedDate}</div>
      </div>
      <div className="flex items-center justify-between pt-1">
        {appraisal.confidence && appraisal.status === 'completed' && (
          <div>{getConfidenceBadge(appraisal.confidence)}</div>
        )}
        <Button size="sm" variant="ghost" className="h-8 ml-auto">
          <ArrowUpRight className="mr-1 h-3.5 w-3.5" />
          <span>View</span>
        </Button>
      </div>
    </div>
  );
};

export const RecentAppraisals: React.FC = () => {
  // In a real application, this data would come from an API
  const appraisals: Appraisal[] = [
    {
      id: '1',
      propertyAddress: '123 Riverside Villa, Miami, FL',
      clientName: 'Coastal Developments Inc.',
      valuation: '$1,250,000',
      status: 'completed',
      date: '2023-05-25',
      confidence: 'high'
    },
    {
      id: '2',
      propertyAddress: '456 Ocean Drive, Malibu, CA',
      clientName: 'Beach Properties LLC',
      valuation: '$3,750,000',
      status: 'in_progress',
      date: '2023-05-27',
      confidence: 'medium'
    },
    {
      id: '3',
      propertyAddress: '789 Highland Road, Aspen, CO',
      clientName: 'Mountain Estates',
      valuation: '$2,100,000',
      status: 'pending_review',
      date: '2023-05-26',
      confidence: 'medium'
    },
    {
      id: '4',
      propertyAddress: '202 Urban Avenue, New York, NY',
      clientName: 'Metropolitan Holdings',
      valuation: '$4,500,000',
      status: 'draft',
      date: '2023-05-28',
      confidence: 'low'
    },
    {
      id: '5',
      propertyAddress: '555 Lakefront Drive, Chicago, IL',
      clientName: 'Windy City Investments',
      valuation: '$1,850,000',
      status: 'cancelled',
      date: '2023-05-20',
      confidence: 'low'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Appraisals</CardTitle>
            <CardDescription>Your latest property valuations</CardDescription>
          </div>
          <Button size="sm" variant="outline">View All</Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {appraisals.map((appraisal) => (
              <AppraisalItem key={appraisal.id} appraisal={appraisal} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default RecentAppraisals; 