import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { CheckCircle, Clock, FileText, Home, UserCheck } from 'lucide-react';

type ActivityType = 'appraisal_created' | 'appraisal_completed' | 'property_added' | 'client_added' | 'report_generated';

interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: string;
  user: {
    name: string;
    avatar?: string;
    initials: string;
  };
  entity?: {
    name: string;
    id: string;
  };
}

const getActivityIcon = (type: ActivityType) => {
  switch (type) {
    case 'appraisal_created':
      return <Clock className="h-5 w-5 text-blue-500" />;
    case 'appraisal_completed':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'property_added':
      return <Home className="h-5 w-5 text-purple-500" />;
    case 'client_added':
      return <UserCheck className="h-5 w-5 text-amber-500" />;
    case 'report_generated':
      return <FileText className="h-5 w-5 text-red-500" />;
  }
};

const getActivityLabel = (type: ActivityType) => {
  switch (type) {
    case 'appraisal_created':
      return <Badge variant="outline" className="border-blue-200 bg-blue-100 text-blue-800">New Appraisal</Badge>;
    case 'appraisal_completed':
      return <Badge variant="outline" className="border-green-200 bg-green-100 text-green-800">Completed</Badge>;
    case 'property_added':
      return <Badge variant="outline" className="border-purple-200 bg-purple-100 text-purple-800">New Property</Badge>;
    case 'client_added':
      return <Badge variant="outline" className="border-amber-200 bg-amber-100 text-amber-800">New Client</Badge>;
    case 'report_generated':
      return <Badge variant="outline" className="border-red-200 bg-red-100 text-red-800">Report</Badge>;
  }
};

const ActivityItem: React.FC<{ activity: Activity }> = ({ activity }) => {
  const timeAgo = new Date(activity.timestamp).toLocaleString();
  
  return (
    <div className="flex items-start pb-4 last:pb-0">
      <div className="mr-4 mt-0.5">
        {getActivityIcon(activity.type)}
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <p className="text-sm font-medium">
              {getActivityLabel(activity.type)}
            </p>
            <p className="ml-2 text-xs text-muted-foreground">
              {timeAgo}
            </p>
          </div>
          <Avatar className="h-6 w-6">
            <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
            <AvatarFallback>{activity.user.initials}</AvatarFallback>
          </Avatar>
        </div>
        <p className="text-sm text-foreground">{activity.description}</p>
        {activity.entity && (
          <p className="text-xs text-muted-foreground">
            {activity.entity.name}
          </p>
        )}
      </div>
    </div>
  );
};

export const ActivityFeed: React.FC = () => {
  // In a real application, this data would come from an API
  const activities: Activity[] = [
    {
      id: '1',
      type: 'appraisal_completed',
      description: 'Completed appraisal for Riverside Villa property',
      timestamp: '2023-05-28T14:30:00Z',
      user: {
        name: 'Alex Johnson',
        avatar: '/avatars/alex-johnson.jpg',
        initials: 'AJ'
      },
      entity: {
        name: 'Riverside Villa, 123 River Road',
        id: 'prop_123'
      }
    },
    {
      id: '2',
      type: 'property_added',
      description: 'Added new beachfront property to inventory',
      timestamp: '2023-05-28T12:15:00Z',
      user: {
        name: 'Miguel Rodriguez',
        initials: 'MR'
      },
      entity: {
        name: 'Sunset Beach House, 456 Ocean Drive',
        id: 'prop_456'
      }
    },
    {
      id: '3',
      type: 'client_added',
      description: 'Added new client Coastal Developments Inc.',
      timestamp: '2023-05-28T10:45:00Z',
      user: {
        name: 'Sarah Williams',
        avatar: '/avatars/sarah-williams.jpg',
        initials: 'SW'
      },
      entity: {
        name: 'Coastal Developments Inc.',
        id: 'client_789'
      }
    },
    {
      id: '4',
      type: 'appraisal_created',
      description: 'Started new appraisal for Mountain View Cabin',
      timestamp: '2023-05-27T16:20:00Z',
      user: {
        name: 'John Davis',
        initials: 'JD'
      },
      entity: {
        name: 'Mountain View Cabin, 789 Highland Road',
        id: 'prop_101'
      }
    },
    {
      id: '5',
      type: 'report_generated',
      description: 'Generated comprehensive appraisal report',
      timestamp: '2023-05-27T14:10:00Z',
      user: {
        name: 'Emily Chen',
        avatar: '/avatars/emily-chen.jpg',
        initials: 'EC'
      },
      entity: {
        name: 'City Loft, 202 Urban Avenue',
        id: 'prop_202'
      }
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Your team's latest actions</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ActivityFeed; 