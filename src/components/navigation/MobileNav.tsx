
import React from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { NavItem } from "./NavItem";

interface NavSection {
  title?: string;
  items: Array<{
    icon: React.ElementType;
    label: string;
    to: string;
  }>;
}

interface MobileNavProps {
  sections: NavSection[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  sections,
  open,
  onOpenChange,
}) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0 pt-10">
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-6 px-2">
            {sections.map((section, index) => (
              <div key={index} className="space-y-2">
                {section.title && (
                  <h3 className="px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                    />
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
};
