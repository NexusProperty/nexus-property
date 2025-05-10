
import React from "react";
import { Link } from "react-router-dom";
import { 
  Card, 
  CardContent, 
  CardFooter,
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  Home, 
  CheckCircle, 
  AlertCircle, 
  Share2, 
  FileText 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Appraisal, AppraisalStatus } from "@/types/appraisal";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface AppraisalCardProps {
  appraisal: Appraisal;
  onPublish?: (id: string) => void;
}

const statusConfig: Record<AppraisalStatus, { label: string; icon: React.ElementType; color: string }> = {
  draft: { 
    label: "Draft", 
    icon: Clock, 
    color: "bg-muted text-muted-foreground" 
  },
  processing: { 
    label: "Processing", 
    icon: Clock, 
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" 
  },
  completed: { 
    label: "Completed", 
    icon: CheckCircle, 
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" 
  },
  published: { 
    label: "Published", 
    icon: Share2, 
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300" 
  },
  claimed: { 
    label: "Claimed", 
    icon: AlertCircle, 
    color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300" 
  },
};

export const AppraisalCard: React.FC<AppraisalCardProps> = ({ appraisal, onPublish }) => {
  const { label, icon: StatusIcon, color } = statusConfig[appraisal.status];
  const formattedDate = formatDistanceToNow(new Date(appraisal.created_at), { addSuffix: true });
  
  const hasValueEstimate = appraisal.estimated_value_min && appraisal.estimated_value_max;
  
  return (
    <Card className="h-full flex flex-col border-l-4 border-l-blue-500">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold line-clamp-2">
            {appraisal.property_address}
          </CardTitle>
          <Badge className={cn("ml-2 whitespace-nowrap", color)}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="py-2 flex-grow">
        <p className="text-sm text-muted-foreground mb-2">
          Generated {formattedDate}
        </p>
        
        {hasValueEstimate ? (
          <div className="mt-3 bg-muted/50 p-3 rounded-md">
            <p className="text-xs text-muted-foreground">Estimated Value</p>
            <p className="text-lg font-medium">
              ${appraisal.estimated_value_min?.toLocaleString()} - ${appraisal.estimated_value_max?.toLocaleString()}
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-center h-20 bg-muted/30 rounded-md">
            <p className="text-sm text-muted-foreground text-center px-3">
              {appraisal.status === 'processing' ? 
                'Your appraisal is being processed...' : 
                'No value estimate available'}
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2 flex flex-col sm:flex-row gap-2 w-full">
        <Button variant="outline" className="w-full sm:w-auto" asChild>
          <Link to={`/customer/appraisals/${appraisal.id}`}>
            <FileText className="h-4 w-4 mr-2" />
            View Details
          </Link>
        </Button>
        
        {appraisal.status === 'completed' && onPublish && (
          <Button className="w-full sm:w-auto" onClick={() => onPublish(appraisal.id)}>
            <Share2 className="h-4 w-4 mr-2" />
            Share with Agents
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
