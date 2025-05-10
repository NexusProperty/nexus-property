
import React, { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  LineChart,
  Database,
  CreditCard,
  FileText,
  BarChartHorizontal,
  Settings,
  LogOut
} from "lucide-react";
import { Sidebar } from "@/components/navigation/Sidebar";
import { Header } from "@/components/navigation/Header";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

// Mock user for demo purposes
const mockUser = {
  name: "Admin User",
  email: "admin@appraisalhub.com",
  role: "admin" as const,
};

export const AdminLayout: React.FC = () => {
  const isMobile = useIsMobile();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // This would be replaced with actual role-based auth check
  const isAdmin = true;

  // In a real implementation, redirect non-admin users
  if (!isAdmin) {
    return <Navigate to="/login" />;
  }

  const handleLogout = () => {
    console.log("Admin logging out");
    // In a real implementation, this would handle the logout process
  };

  const navSections = [
    {
      items: [
        {
          icon: LayoutDashboard,
          label: "Dashboard",
          to: "/admin",
        },
      ],
    },
    {
      title: "Management",
      items: [
        {
          icon: Users,
          label: "User Management",
          to: "/admin/users",
        },
        {
          icon: LineChart,
          label: "System Monitoring",
          to: "/admin/monitoring",
        },
        {
          icon: Database,
          label: "Data Management",
          to: "/admin/data",
        },
        {
          icon: CreditCard,
          label: "Subscription",
          to: "/admin/subscription",
        },
        {
          icon: FileText,
          label: "Content Management",
          to: "/admin/content",
        },
      ],
    },
    {
      title: "Analysis",
      items: [
        {
          icon: BarChartHorizontal,
          label: "Analytics",
          to: "/admin/analytics",
        },
      ],
    },
  ];

  const footerNav = (
    <div className="flex flex-col space-y-2">
      <Button variant="ghost" className="justify-start" asChild>
        <a href="/admin/settings">
          <Settings className="mr-2 h-4 w-4" />
          <span className="hidden lg:inline">Settings</span>
        </a>
      </Button>
      <Button variant="ghost" className="justify-start text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleLogout}>
        <LogOut className="mr-2 h-4 w-4" />
        <span className="hidden lg:inline">Logout</span>
      </Button>
    </div>
  );

  return (
    <div className="flex h-screen">
      {!isMobile && <Sidebar sections={navSections} footer={footerNav} />}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header
          user={mockUser}
          showMobileMenu={showMobileMenu}
          onMobileMenuToggle={() => setShowMobileMenu(!showMobileMenu)}
          onLogout={handleLogout}
          showLogo={isMobile}
        />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
