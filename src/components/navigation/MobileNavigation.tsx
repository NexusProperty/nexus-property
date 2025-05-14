import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Menu, X, ChevronRight, ChevronDown, 
  Home, Users, FileText, Settings, 
  Building, ClipboardCheck, BarChart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import '../../styles/responsive-utilities.css';

interface NavItem {
  name: string;
  href: string;
  icon?: React.ReactNode;
  children?: NavItem[];
}

interface MobileNavigationProps {
  items: NavItem[];
  userRole?: 'admin' | 'agent' | 'customer';
}

// Default navigation items organized by user role
const defaultNavItems: Record<string, NavItem[]> = {
  agent: [
    {
      name: 'Dashboard',
      href: '/agent/dashboard',
      icon: <Home className="h-5 w-5" />
    },
    {
      name: 'Properties',
      href: '/agent/properties',
      icon: <Building className="h-5 w-5" />,
      children: [
        { name: 'All Properties', href: '/agent/properties' },
        { name: 'Add Property', href: '/agent/properties/new' }
      ]
    },
    {
      name: 'Appraisals',
      href: '/agent/appraisals',
      icon: <ClipboardCheck className="h-5 w-5" />,
      children: [
        { name: 'Active Appraisals', href: '/agent/appraisals' },
        { name: 'New Appraisal', href: '/agent/appraisals/new' }
      ]
    },
    {
      name: 'Clients',
      href: '/agent/clients',
      icon: <Users className="h-5 w-5" />
    },
    {
      name: 'Reports',
      href: '/agent/reports',
      icon: <FileText className="h-5 w-5" />
    },
    {
      name: 'Analytics',
      href: '/agent/analytics',
      icon: <BarChart className="h-5 w-5" />
    },
    {
      name: 'Settings',
      href: '/agent/settings',
      icon: <Settings className="h-5 w-5" />
    }
  ],
  customer: [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: <Home className="h-5 w-5" />
    },
    {
      name: 'My Properties',
      href: '/properties',
      icon: <Building className="h-5 w-5" />
    },
    {
      name: 'My Appraisals',
      href: '/appraisals',
      icon: <ClipboardCheck className="h-5 w-5" />
    },
    {
      name: 'Account Settings',
      href: '/settings',
      icon: <Settings className="h-5 w-5" />
    }
  ],
  admin: [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: <Home className="h-5 w-5" />
    },
    {
      name: 'User Management',
      href: '/admin/users',
      icon: <Users className="h-5 w-5" />,
      children: [
        { name: 'All Users', href: '/admin/users' },
        { name: 'Add User', href: '/admin/users/new' }
      ]
    },
    {
      name: 'Team Management',
      href: '/admin/teams',
      icon: <Users className="h-5 w-5" />
    },
    {
      name: 'System Settings',
      href: '/admin/settings',
      icon: <Settings className="h-5 w-5" />,
      children: [
        { name: 'Application Settings', href: '/admin/settings/application' },
        { name: 'Email Templates', href: '/admin/settings/email-templates' }
      ]
    }
  ]
};

const MobileNavigation: React.FC<MobileNavigationProps> = ({ 
  items = [], 
  userRole = 'agent' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  
  // Use the provided items or fallback to default based on user role
  const navItems = items.length > 0 ? items : defaultNavItems[userRole] || [];

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isOpen && !target.closest('.mobile-menu') && !target.closest('.mobile-menu-toggle')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Prevent body scrolling when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const toggleSubmenu = (itemName: string) => {
    setExpandedItems(current => 
      current.includes(itemName)
        ? current.filter(name => name !== itemName)
        : [...current, itemName]
    );
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <>
      <Button 
        variant="ghost" 
        size="icon" 
        className="lg:hidden mobile-menu-toggle" 
        onClick={toggleMenu}
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
      >
        <Menu className="h-6 w-6" />
      </Button>
      
      <div className={cn("mobile-menu-container", isOpen && "open")}>
        <div className={cn("mobile-menu", isOpen && "open")}>
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-bold text-lg">Menu</h2>
            <Button variant="ghost" size="icon" onClick={closeMenu}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="p-4">
            <ul className="space-y-2">
              {navItems.map((item, index) => (
                <li key={index} className="rounded-md overflow-hidden">
                  {item.children ? (
                    <div className="flex flex-col">
                      <button
                        className="flex items-center justify-between p-3 w-full text-left hover:bg-gray-100 rounded-md"
                        onClick={() => toggleSubmenu(item.name)}
                      >
                        <div className="flex items-center">
                          {item.icon && <span className="mr-3 text-gray-500">{item.icon}</span>}
                          <span>{item.name}</span>
                        </div>
                        {expandedItems.includes(item.name) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      
                      {expandedItems.includes(item.name) && (
                        <ul className="mt-1 ml-6 space-y-1 border-l-2 border-gray-200 pl-3">
                          {item.children.map((child, childIndex) => (
                            <li key={childIndex}>
                              <Link
                                to={child.href}
                                className="block p-2 hover:bg-gray-100 rounded-md"
                                onClick={closeMenu}
                              >
                                {child.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <Link
                      to={item.href}
                      className="flex items-center p-3 hover:bg-gray-100 rounded-md"
                      onClick={closeMenu}
                    >
                      {item.icon && <span className="mr-3 text-gray-500">{item.icon}</span>}
                      <span>{item.name}</span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
};

export default MobileNavigation; 