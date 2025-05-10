
import React from "react";
import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileNav } from "./MobileNav";
import { UserMenu } from "./UserMenu";
import { Logo } from "./Logo";
import { useIsMobile } from "@/hooks/use-mobile";
import { UserRole } from "@/types/auth";

interface HeaderProps {
  user?: {
    name: string;
    email: string;
    role: UserRole;
    avatarUrl?: string;
  } | null;
  showMobileMenu?: boolean;
  onMobileMenuToggle?: () => void;
  onLogout?: () => void;
  showLogo?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  showMobileMenu,
  onMobileMenuToggle,
  onLogout = () => {},
  showLogo = true,
}) => {
  const isMobile = useIsMobile();

  return (
    <header className="flex h-16 items-center border-b bg-background px-4 md:px-6">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-4">
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="mr-2"
              onClick={onMobileMenuToggle}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          )}
          {showLogo && <Logo />}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <UserMenu
              name={user.name}
              email={user.email}
              role={user.role}
              avatarUrl={user.avatarUrl}
              onLogout={onLogout}
            />
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Log In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/register">Register</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
