import React, { useState } from 'react';
import { Bell, Search, Settings, User, HelpCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { signOut } from '@/services/auth';
import { Link } from 'react-router-dom';

// Sample notifications - would come from a service in a real implementation
const sampleNotifications = [
  {
    id: '1',
    title: 'New appraisal request',
    message: 'You have a new appraisal request from John Doe',
    time: '10 minutes ago',
    read: false,
  },
  {
    id: '2',
    title: 'Appraisal completed',
    message: 'Appraisal for 123 Main St. has been completed',
    time: '1 hour ago',
    read: false,
  },
  {
    id: '3',
    title: 'Report ready',
    message: 'Your report for 456 Elm St. is ready to download',
    time: '3 hours ago',
    read: true,
  },
];

const DashboardHeader: React.FC = () => {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState(sampleNotifications);
  const [searchQuery, setSearchQuery] = useState('');
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const handleSignOut = async () => {
    await signOut();
  };
  
  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality here
    console.log('Searching for:', searchQuery);
  };
  
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 py-2 h-16">
        {/* Page title - could be dynamic based on current route */}
        <div className="md:hidden">
          <h1 className="text-xl font-semibold">Dashboard</h1>
        </div>
        
        {/* Search bar - hidden on mobile */}
        <div className="hidden md:flex items-center flex-1 max-w-md">
          <form onSubmit={handleSearch} className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search properties, appraisals, clients..."
              className="w-full pl-9 pr-4 py-2"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Help */}
          <Button variant="ghost" size="icon" className="rounded-full">
            <HelpCircle className="h-5 w-5 text-gray-600" />
          </Button>
          
          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="relative rounded-full">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h4 className="font-medium">Notifications</h4>
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={markAllAsRead}
                    className="text-xs h-8"
                  >
                    Mark all as read
                  </Button>
                )}
              </div>
              <div className="max-h-[60vh] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    <p>No notifications</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((notification) => (
                      <div 
                        key={notification.id} 
                        className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.read ? 'bg-blue-50/50' : ''}`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-medium text-sm">{notification.title}</p>
                          <span className="text-xs text-gray-500">{notification.time}</span>
                        </div>
                        <p className="text-sm text-gray-600">{notification.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-2 border-t border-gray-100 bg-gray-50">
                <Button variant="ghost" size="sm" asChild className="w-full justify-center text-sm h-8">
                  <Link to="/dashboard/notifications">View all notifications</Link>
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          
          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="rounded-full h-8 overflow-hidden p-0">
                <span className="sr-only">Open user menu</span>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || 'User'} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {profile?.full_name?.[0] || profile?.email?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{profile?.full_name || 'User'}</p>
                  <p className="text-xs text-gray-500">{profile?.email}</p>
                  <Badge variant="outline" className="w-fit mt-1">
                    {profile?.role || 'User'}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/dashboard/profile" className="flex items-center cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/dashboard/settings" className="flex items-center cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-500 focus:text-red-500">
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader; 