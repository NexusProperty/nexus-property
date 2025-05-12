
import React, { useState } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { Home, FileText, Settings, LogOut } from "lucide-react";
import { Header } from "@/components/navigation/Header";
import { MobileNav } from "@/components/navigation/MobileNav";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/ui/use-toast";

export const CustomerLayout: React.FC = () => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();
  
  // For demo purposes, we'll pretend the user is authenticated
  // In a real implementation, this would be determined by the auth state
  const isCustomer = true; // user?.role === 'customer';

  // In a real implementation, redirect non-customer users
  if (!isCustomer) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logged out successfully",
      });
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        title: "Error logging out",
        variant: "destructive",
      });
    }
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
        user={user || {
          name: "Jane Customer",
          email: "jane@example.com",
          role: "customer"
        }}
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
