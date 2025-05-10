
import React from "react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/types/auth";

interface UserMenuProps {
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  onLogout: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  name,
  email,
  role,
  avatarUrl,
  onLogout,
}) => {
  // Get initials from name for avatar fallback
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Get settings path based on user role
  const getSettingsPath = () => {
    switch (role) {
      case "agent":
        return "/agent/settings";
      case "customer":
        return "/customer/settings";
      case "admin":
        return "/admin/settings";
      default:
        return "/settings";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar>
            <AvatarImage src={avatarUrl} alt={name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <div className="p-2 text-sm">
          <p className="font-medium">{name}</p>
          <p className="text-muted-foreground text-xs">{email}</p>
          <p className="text-muted-foreground text-xs capitalize mt-1">
            {role} Account
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to={getSettingsPath()}>Profile Settings</Link>
        </DropdownMenuItem>
        {role === "admin" && (
          <DropdownMenuItem asChild>
            <Link to="/admin/settings">System Settings</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link to="/help">Help & Support</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout}>Logout</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
