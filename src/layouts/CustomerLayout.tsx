import { Outlet, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, FileText, User } from "lucide-react";

export const CustomerLayout = () => {
  const location = useLocation();

  const navItems = [
    { path: "/customer", label: "Dashboard", icon: Home },
    { path: "/customer/appraisals", label: "My Appraisals", icon: FileText },
    { path: "/customer/profile", label: "Profile", icon: User },
  ];

  return (
    <div className="min-h-screen flex">
      <nav className="w-64 border-r p-4">
        <div className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.path}
                variant={location.pathname === item.path ? "default" : "ghost"}
                className="w-full justify-start"
                asChild
              >
                <Link to={item.path}>
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            );
          })}
        </div>
      </nav>
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}; 