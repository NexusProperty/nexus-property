import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { CheckCircle2, Clock, Flag, PlusCircle, AlertCircle } from 'lucide-react';

type TaskPriority = 'high' | 'medium' | 'low';
type TaskStatus = 'pending' | 'in_progress' | 'completed';

interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  type: 'appraisal' | 'property' | 'client' | 'report' | 'meeting';
}

const getPriorityBadge = (priority: TaskPriority) => {
  switch (priority) {
    case 'high':
      return <Badge variant="outline" className="border-red-200 bg-red-100 text-red-800">High</Badge>;
    case 'medium':
      return <Badge variant="outline" className="border-amber-200 bg-amber-100 text-amber-800">Medium</Badge>;
    case 'low':
      return <Badge variant="outline" className="border-green-200 bg-green-100 text-green-800">Low</Badge>;
  }
};

const getStatusIcon = (status: TaskStatus) => {
  switch (status) {
    case 'pending':
      return <Clock className="h-4 w-4 text-amber-500" />;
    case 'in_progress':
      return <Flag className="h-4 w-4 text-blue-500" />;
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  }
};

const getTaskTypeIcon = (type: Task['type']) => {
  switch (type) {
    case 'appraisal':
      return <AlertCircle className="h-4 w-4 text-purple-500" />;
    case 'property':
      return <AlertCircle className="h-4 w-4 text-blue-500" />;
    case 'client':
      return <AlertCircle className="h-4 w-4 text-amber-500" />;
    case 'report':
      return <AlertCircle className="h-4 w-4 text-green-500" />;
    case 'meeting':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
  }
};

const TaskItem: React.FC<{ task: Task }> = ({ task }) => {
  const dueDate = new Date(task.dueDate);
  const isOverdue = dueDate < new Date();
  const formattedDate = dueDate.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return (
    <div className="flex items-start space-x-4 pb-4 last:pb-0">
      <div className="mt-0.5">
        {getTaskTypeIcon(task.type)}
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium leading-none">{task.title}</p>
            <p className="text-xs text-muted-foreground">{task.description}</p>
          </div>
          {getPriorityBadge(task.priority)}
        </div>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center">
            {getStatusIcon(task.status)}
            <span className="ml-1 text-muted-foreground">
              {task.status === 'pending' ? 'Pending' : 
               task.status === 'in_progress' ? 'In Progress' : 'Completed'}
            </span>
          </div>
          <span className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
            {isOverdue ? 'Overdue: ' : 'Due: '}{formattedDate}
          </span>
        </div>
      </div>
    </div>
  );
};

export const UpcomingTasks: React.FC = () => {
  // In a real application, this data would come from an API
  const tasks: Task[] = [
    {
      id: '1',
      title: 'Complete Riverside Villa Appraisal',
      description: 'Final valuation and report submission',
      dueDate: '2023-05-30T14:00:00Z',
      priority: 'high',
      status: 'in_progress',
      type: 'appraisal'
    },
    {
      id: '2',
      title: 'Update Property Photos for Beachfront',
      description: 'Take new exterior and amenity photos',
      dueDate: '2023-05-29T15:30:00Z',
      priority: 'medium',
      status: 'pending',
      type: 'property'
    },
    {
      id: '3',
      title: 'Client Meeting: Coastal Developments',
      description: 'Discuss portfolio expansion strategy',
      dueDate: '2023-05-31T10:00:00Z',
      priority: 'high',
      status: 'pending',
      type: 'meeting'
    },
    {
      id: '4',
      title: 'Generate Monthly Performance Report',
      description: 'Compile team statistics and insights',
      dueDate: '2023-06-01T17:00:00Z',
      priority: 'medium',
      status: 'pending',
      type: 'report'
    },
    {
      id: '5',
      title: 'Follow-up with New Clients',
      description: 'Check in on recent onboarding experience',
      dueDate: '2023-05-29T13:00:00Z',
      priority: 'low',
      status: 'pending',
      type: 'client'
    }
  ];

  // Sort tasks by due date (ascending) and then by priority
  const sortedTasks = [...tasks].sort((a, b) => {
    const dateA = new Date(a.dueDate).getTime();
    const dateB = new Date(b.dueDate).getTime();
    
    if (dateA !== dateB) {
      return dateA - dateB;
    }
    
    const priorityWeight = { high: 0, medium: 1, low: 2 };
    return priorityWeight[a.priority] - priorityWeight[b.priority];
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Upcoming Tasks</CardTitle>
          <CardDescription>Tasks and reminders requiring your attention</CardDescription>
        </div>
        <Button size="sm" variant="outline" className="h-8 gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span>Add</span>
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[280px] pr-4">
          <div className="space-y-4">
            {sortedTasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default UpcomingTasks; 