import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { Bell, CheckCircle, AlertCircle, InfoIcon, Clock, ChevronRight } from 'lucide-react';

// Example notification type
interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'action_required';
  title: string;
  message: string;
  date: Date;
  isRead: boolean;
  actionLink?: string;
  actionText?: string;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  notifications, 
  onMarkAsRead, 
  onMarkAllAsRead 
}) => {
  // Function to get icon based on notification type
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case 'action_required':
        return <Clock className="h-5 w-5 text-red-500" />;
      case 'info':
      default:
        return <InfoIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (notifications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Stay updated with your property activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Bell className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No notifications</h3>
            <p className="mt-1 text-sm text-gray-500">You're all caught up!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="flex items-center">
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                {unreadCount} new
              </span>
            )}
          </CardTitle>
          <CardDescription>Stay updated with your property activity</CardDescription>
        </div>
        {unreadCount > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onMarkAllAsRead}
            className="text-xs"
          >
            Mark all as read
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`p-3 flex items-start space-x-3 rounded-lg border 
                ${!notification.isRead ? 'bg-blue-50 border-blue-100' : 'hover:bg-muted/50'} 
                transition-colors`}
            >
              <div className="shrink-0 mt-0.5">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-sm text-foreground">{notification.title}</h4>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                    {formatDistanceToNow(notification.date, { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                <div className="flex justify-between items-center mt-2">
                  {notification.actionLink && notification.actionText && (
                    <Button variant="link" size="sm" className="h-auto p-0 text-xs font-medium">
                      {notification.actionText}
                      <ChevronRight className="ml-1 h-3 w-3" />
                    </Button>
                  )}
                  {!notification.isRead && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="ml-auto h-auto py-0 px-2 text-xs"
                      onClick={() => onMarkAsRead(notification.id)}
                    >
                      Mark as read
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationCenter; 