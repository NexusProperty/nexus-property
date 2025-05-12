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
  X
} from 'lucide-react';
import { signOut } from '@/services/auth';
import { Database } from '@/types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, isActive }) => {
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
      <span>{label}</span>
    </Link>
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
    return location.pathname === path;
  };
  
  // Get navigation items based on user role
  const getNavItems = (profile: Profile | null) => {
    // Common navigation items for all roles
    const commonItems = [
      {
        to: '/dashboard',
        icon: <Home size={20} />,
        label: 'Dashboard',
      },
    ];
    
    // Role-specific navigation items
    const roleSpecificItems = {
      agent: [
        {
          to: '/dashboard/appraisals',
          icon: <FileText size={20} />,
          label: 'Appraisals',
        },
        {
          to: '/dashboard/clients',
          icon: <Users size={20} />,
          label: 'Clients',
        },
        {
          to: '/dashboard/properties',
          icon: <Building size={20} />,
          label: 'Properties',
        },
        {
          to: '/dashboard/reports',
          icon: <BarChart4 size={20} />,
          label: 'Reports',
        },
      ],
      customer: [
        {
          to: '/dashboard/properties',
          icon: <Building size={20} />,
          label: 'My Properties',
        },
        {
          to: '/dashboard/appraisals',
          icon: <FileText size={20} />,
          label: 'Appraisals',
        },
      ],
      admin: [
        {
          to: '/dashboard/users',
          icon: <Users size={20} />,
          label: 'Users',
        },
        {
          to: '/dashboard/appraisals',
          icon: <FileText size={20} />,
          label: 'Appraisals',
        },
        {
          to: '/dashboard/properties',
          icon: <Building size={20} />,
          label: 'Properties',
        },
        {
          to: '/dashboard/reports',
          icon: <BarChart4 size={20} />,
          label: 'Reports',
        },
      ],
    };
    
    // Bottom navigation items common to all roles
    const bottomItems = [
      {
        to: '/dashboard/settings',
        icon: <Settings size={20} />,
        label: 'Settings',
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
  
  return (
    <>
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
          'bg-white border-r border-gray-200 flex flex-col w-64 transition-all duration-300 ease-in-out',
          isOpen ? 'fixed inset-y-0 left-0 z-40' : 'hidden md:flex'
        )}
      >
        {/* Logo & brand */}
        <div className="p-4 border-b border-gray-200">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-bold text-xl text-primary">AppraisalHub</span>
          </Link>
        </div>
        
        {/* Main navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {mainItems.map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              isActive={isActive(item.to)}
            />
          ))}
        </nav>
        
        {/* Bottom navigation & user info */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          {bottomItems.map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              isActive={isActive(item.to)}
            />
          ))}
          
          <Button
            variant="ghost"
            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={handleSignOut}
          >
            <LogOut size={20} className="mr-2" />
            Sign out
          </Button>
          
          {profile && (
            <div className="pt-2 mt-2 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium">
                  {profile.full_name?.[0] || profile.email[0]}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-medium truncate">{profile.full_name || 'User'}</p>
                  <p className="text-xs text-gray-500 truncate">{profile.email}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default DashboardSidebar; 