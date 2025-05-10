
import React, { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Home, 
  FileText, 
  Users, 
  Puzzle, 
  Bell, 
  Settings, 
  LogOut 
} from "lucide-react";
import { Sidebar } from "@/components/navigation/Sidebar";
import { Header } from "@/components/navigation/Header";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

// Mock user for demo purposes
const mockUser = {
  name: "John Agent",
  email: "john@realestate.com",
  role: "agent" as const,
};

export const AgentLayout: React.FC = () => {
  const isMobile = useIsMobile();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // This would be replaced with actual role-based auth check
  const isAgent = true;

  // In a real implementation, redirect non-agent users
  if (!isAgent) {
    return <Navigate to="/login" />;
  }

  const handleLogout = () => {
    console.log("Agent logging out");
    // In a real implementation, this would handle the logout process
  };

  const navSections = [
    {
      items: [
        {
          icon: LayoutDashboard,
          label: "Dashboard",
          to: "/agent",
        },
      ],
    },
    {
      title: "Appraisals",
      items: [
        {
          icon: Home,
          label: "Appraisals",
          to: "/agent/appraisals",
        },
        {
          icon: FileText,
          label: "Appraisal Feed",
          to: "/agent/appraisal-feed",
        },
      ],
    },
    {
      title: "Management",
      items: [
        {
          icon: Users,
          label: "Team Management",
          to: "/agent/team",
        },
        {
          icon: Puzzle,
          label: "Integration Hub",
          to: "/agent/integrations",
        },
      ],
    },
  ];

  const footerNav = (
    <div className="flex flex-col space-y-2">
      <Button variant="ghost" className="justify-start" asChild>
        <a href="/agent/settings">
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
