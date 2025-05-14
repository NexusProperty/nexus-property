import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  FileText, 
  Users, 
  Settings, 
  LogOut,
  BarChart4,
  Building,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  User,
  Bell,
  HelpCircle,
  BookOpen
} from 'lucide-react';
import { signOut } from '@/services/auth';
import { Database } from '@/types/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  badge?: string | number;
}

// Simple navigation item component
const NavItem: React.FC<NavItemProps> = ({ to, icon, label, isActive, badge }) => {
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-md transition-colors',
        isActive
          ? 'bg-primary/10 text-primary font-medium'
          : 'text-gray-600 hover:bg-gray-100'
      )}
    >
      {icon}
      <span className="flex-1">{label}</span>
      {badge && (
        <Badge variant={isActive ? "default" : "outline"} className="ml-auto">
          {badge}
        </Badge>
      )}
    </Link>
  );
};

// Collapsible navigation section component
interface NavSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const NavSection: React.FC<NavSectionProps> = ({ 
  title, 
  icon, 
  children,
  defaultOpen = false 
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="w-full"
    >
      <CollapsibleTrigger asChild>
        <button className="flex items-center w-full gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
          {icon}
          <span className="font-medium">{title}</span>
          <div className="ml-auto">
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-8 pr-2 py-1 space-y-1">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

const DashboardSidebar: React.FC = () => {
  const { profile } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };
  
  const handleSignOut = async () => {
    await signOut();
  };

  const isActive = (path: string) => {
    if (path === '/dashboard' && location.pathname === '/dashboard') {
      return true;
    }
    // For other routes, check if the current path starts with the given path
    // This ensures that sub-routes highlight the parent nav item
    return path !== '/dashboard' && location.pathname.startsWith(path);
  };
  
  // Get navigation items based on user role
  const getNavItems = (profile: Profile | null) => {
    // Common navigation items for all roles
    const commonItems = [
      {
        to: '/dashboard',
        icon: <LayoutDashboard size={20} />,
        label: 'Dashboard',
      },
    ];
    
    // Role-specific navigation items
    const roleSpecificItems = {
      agent: [
        {
          section: 'Property Management',
          icon: <Building size={20} />,
          items: [
            {
              to: '/dashboard/properties',
              icon: <Building size={16} />,
              label: 'Properties',
              badge: 12
            },
            {
              to: '/dashboard/properties/new',
              icon: <FileText size={16} />,
              label: 'Add Property',
            },
          ]
        },
        {
          section: 'Appraisals',
          icon: <FileText size={20} />,
          items: [
            {
              to: '/dashboard/appraisals',
              icon: <FileText size={16} />,
              label: 'All Appraisals',
              badge: 5
            },
            {
              to: '/dashboard/appraisals/new',
              icon: <FileText size={16} />,
              label: 'New Appraisal',
            },
          ]
        },
        {
          section: 'Clients',
          icon: <Users size={20} />,
          items: [
            {
              to: '/dashboard/clients',
              icon: <Users size={16} />,
              label: 'Client List',
              badge: 8
            },
            {
              to: '/dashboard/clients/new',
              icon: <User size={16} />,
              label: 'Add Client',
            },
          ]
        },
        {
          to: '/dashboard/reports',
          icon: <BarChart4 size={20} />,
          label: 'Reports',
          badge: 3
        },
      ],
      customer: [
        {
          to: '/dashboard/properties',
          icon: <Building size={20} />,
          label: 'My Properties',
          badge: 2
        },
        {
          to: '/dashboard/appraisals',
          icon: <FileText size={20} />,
          label: 'Appraisals',
          badge: 1
        },
        {
          to: '/dashboard/reports',
          icon: <BarChart4 size={20} />,
          label: 'Reports',
        },
      ],
      admin: [
        {
          section: 'User Management',
          icon: <Users size={20} />,
          items: [
            {
              to: '/dashboard/users',
              icon: <Users size={16} />,
              label: 'All Users',
              badge: 24
            },
            {
              to: '/dashboard/teams',
              icon: <Users size={16} />,
              label: 'Teams',
              badge: 5
            },
          ]
        },
        {
          section: 'Content',
          icon: <FileText size={20} />,
          items: [
            {
              to: '/dashboard/appraisals',
              icon: <FileText size={16} />,
              label: 'Appraisals',
              badge: 18
            },
            {
              to: '/dashboard/properties',
              icon: <Building size={16} />,
              label: 'Properties',
              badge: 32
            },
            {
              to: '/dashboard/reports',
              icon: <BarChart4 size={16} />,
              label: 'Reports',
              badge: 14
            },
          ]
        },
      ],
    };
    
    // Bottom navigation items common to all roles
    const bottomItems = [
      {
        to: '/dashboard/notifications',
        icon: <Bell size={20} />,
        label: 'Notifications',
        badge: 3
      },
      {
        to: '/dashboard/settings',
        icon: <Settings size={20} />,
        label: 'Settings',
      },
      {
        to: '/dashboard/help',
        icon: <HelpCircle size={20} />,
        label: 'Help & Support',
      },
    ];
    
    if (!profile) {
      return { mainItems: commonItems, bottomItems };
    }
    
    return {
      mainItems: [...commonItems, ...(roleSpecificItems[profile.role] || [])],
      bottomItems,
    };
  };
  
  const { mainItems, bottomItems } = getNavItems(profile);
  
  // Handle sidebar backdrop click on mobile
  const handleBackdropClick = () => {
    if (isOpen) {
      setIsOpen(false);
    }
  };

  // Render flat or nested navigation items
  const renderNavItems = (items) => {
    return items.map((item, index) => {
      // Section with nested items
      if (item.section) {
        return (
          <NavSection 
            key={item.section} 
            title={item.section} 
            icon={item.icon}
            defaultOpen={index === 0} // Open first section by default
          >
            {item.items.map((subItem) => (
              <NavItem
                key={subItem.to}
                to={subItem.to}
                icon={subItem.icon}
                label={subItem.label}
                isActive={isActive(subItem.to)}
                badge={subItem.badge}
              />
            ))}
          </NavSection>
        );
      }
      
      // Regular nav item
      return (
        <NavItem
          key={item.to}
          to={item.to}
          icon={item.icon}
          label={item.label}
          isActive={isActive(item.to)}
          badge={item.badge}
        />
      );
    });
  };
  
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden" 
          onClick={handleBackdropClick}
        />
      )}
    
      {/* Mobile sidebar toggle button */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed bottom-4 right-4 z-50 p-3 bg-primary text-white rounded-full shadow-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
      
      {/* Sidebar */}
      <aside 
        className={cn(
          'bg-white border-r border-gray-200 flex flex-col h-screen transition-all duration-300 ease-in-out',
          isOpen 
            ? 'fixed inset-y-0 left-0 z-40 w-64 shadow-xl' 
            : 'hidden md:flex w-64'
        )}
      >
        {/* Logo & brand */}
        <div className="p-4 border-b border-gray-200 flex items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/90 flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-xl text-primary">AppraisalHub</span>
          </Link>
          
          {/* Mobile close button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="ml-auto md:hidden"
            onClick={toggleSidebar}
          >
            <X size={20} />
          </Button>
        </div>
        
        {/* Main navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {renderNavItems(mainItems)}
        </nav>
        
        {/* Bottom navigation & user info */}
        <div className="p-3 border-t border-gray-200 space-y-1">
          {renderNavItems(bottomItems)}
          
          <Separator className="my-2" />
          
          {profile && (
            <div className="p-2">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile.avatar_url || ''} alt={profile.full_name || 'User'} />
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {profile.full_name?.[0] || profile.email[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{profile.full_name || 'User'}</p>
                  <p className="text-xs text-gray-500 truncate">{profile.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={handleSignOut}
                >
                  <LogOut size={18} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default DashboardSidebar; 