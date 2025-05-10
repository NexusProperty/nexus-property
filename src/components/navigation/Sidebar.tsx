
import React, { ReactNode, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";
import { NavItem } from "./NavItem";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface NavSection {
  title?: string;
  items: Array<{
    icon: React.ElementType;
    label: string;
    to: string;
  }>;
}

interface SidebarProps {
  sections: NavSection[];
  footer?: ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({ sections, footer }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isMobile = useIsMobile();

  // On mobile, sidebar is always collapsed (hidden)
  const effectiveCollapsed = isMobile || isCollapsed;

  return (
    <div
      className={cn(
        "flex flex-col border-r bg-background h-screen transition-all duration-300",
        effectiveCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b">
        <div className={cn("overflow-hidden", effectiveCollapsed && "w-8")}>
          <Logo variant={effectiveCollapsed ? "icon" : "full"} />
        </div>
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8"
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform",
                isCollapsed && "rotate-180"
              )}
            />
            <span className="sr-only">
              {isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            </span>
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-2">
        <nav className="space-y-6">
          {sections.map((section, index) => (
            <div key={index} className="space-y-2">
              {section.title && !effectiveCollapsed && (
                <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {section.title}
                </h3>
              )}
              <ul className="space-y-1">
                {section.items.map((item, itemIndex) => (
                  <NavItem
                    key={itemIndex}
                    icon={item.icon}
                    label={item.label}
                    to={item.to}
                    isCollapsed={effectiveCollapsed}
                  />
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {footer && (
        <div className={cn("p-4 border-t", effectiveCollapsed && "items-center justify-center")}>
          {footer}
        </div>
      )}
    </div>
  );
};
