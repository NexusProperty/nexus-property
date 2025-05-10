
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  to: string;
  isCollapsed?: boolean;
}

export const NavItem: React.FC<NavItemProps> = ({
  icon: Icon,
  label,
  to,
  isCollapsed = false,
}) => {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);

  return (
    <li className="w-full">
      {isCollapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to={to}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-md",
                "transition-colors hover:bg-muted",
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground"
              )}
              aria-label={label}
            >
              <Icon className="h-5 w-5" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" align="center">
            {label}
          </TooltipContent>
        </Tooltip>
      ) : (
        <Link
          to={to}
          className={cn(
            "flex w-full items-center gap-3 rounded-md px-3 py-2",
            "transition-colors hover:bg-muted",
            isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"
          )}
        >
          <Icon className="h-5 w-5" />
          <span>{label}</span>
          {isActive && (
            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
          )}
        </Link>
      )}
    </li>
  );
};
