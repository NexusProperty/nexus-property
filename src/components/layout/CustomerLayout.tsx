
import React, { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { Home, FileText, Settings, LogOut } from "lucide-react";
import { Header } from "@/components/navigation/Header";
import { MobileNav } from "@/components/navigation/MobileNav";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

// Mock user for demo purposes
const mockUser = {
  name: "Jane Customer",
  email: "jane@example.com",
  role: "customer" as const,
};

export const CustomerLayout: React.FC = () => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // This would be replaced with actual role-based auth check
  const isCustomer = true;

  // In a real implementation, redirect non-customer users
  if (!isCustomer) {
    return <Navigate to="/login" />;
  }

  const handleLogout = () => {
    console.log("Customer logging out");
    // In a real implementation, this would handle the logout process
  };

  const navSections = [
    {
      items: [
        {
          icon: Home,
          label: "Get Free Appraisal",
          to: "/customer",
        },
        {
          icon: FileText,
          label: "My Appraisals",
          to: "/customer/appraisals",
        },
        {
          icon: Settings,
          label: "Account Settings",
          to: "/customer/settings",
        },
      ],
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        user={mockUser}
        showMobileMenu={showMobileMenu}
        onMobileMenuToggle={() => setShowMobileMenu(!showMobileMenu)}
        onLogout={handleLogout}
      />
      <MobileNav 
        sections={navSections}
        open={showMobileMenu}
        onOpenChange={setShowMobileMenu}
      />
      
      <div className="container mx-auto px-4 py-6 flex-1">
        <nav className="hidden md:flex mb-8 border-b pb-2">
          {navSections[0].items.map((item, index) => (
            <Button key={index} variant="ghost" className="mr-2" asChild>
              <a href={item.to}>
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </a>
            </Button>
          ))}
        </nav>
        
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
