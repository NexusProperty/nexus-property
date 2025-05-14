import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cva, type VariantProps } from 'class-variance-authority';

// Define card variants using class-variance-authority
const dashboardCardVariants = cva(
  "transition-all",
  {
    variants: {
      variant: {
        default: "bg-white",
        primary: "bg-primary/10 border-primary/20",
        success: "bg-green-50 border-green-200",
        warning: "bg-amber-50 border-amber-200", 
        danger: "bg-red-50 border-red-200",
        info: "bg-blue-50 border-blue-200",
      },
      hover: {
        true: "hover:shadow-md hover:-translate-y-1 cursor-pointer",
        false: "",
      }
    },
    defaultVariants: {
      variant: "default",
      hover: false,
    },
  }
);

// Define metrics card variants
const metricVariants = cva(
  "text-2xl sm:text-3xl font-bold",
  {
    variants: {
      variant: {
        default: "text-gray-900",
        primary: "text-primary",
        success: "text-green-600",
        warning: "text-amber-600",
        danger: "text-red-600",
        info: "text-blue-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface DashboardCardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof dashboardCardVariants> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
  isLoading?: boolean;
}

export const DashboardCard = React.forwardRef<HTMLDivElement, DashboardCardProps>(
  ({ className, variant, hover, title, description, icon, footer, isLoading = false, children, ...props }, ref) => {
    return (
      <Card 
        ref={ref} 
        className={cn(dashboardCardVariants({ variant, hover, className }))} 
        {...props}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {description && (
              <CardDescription className="text-xs mt-1">{description}</CardDescription>
            )}
          </div>
          {icon && (
            <div className={cn(
              "p-2 rounded-full", 
              variant === "primary" && "bg-primary/10 text-primary",
              variant === "success" && "bg-green-100 text-green-600",
              variant === "warning" && "bg-amber-100 text-amber-600",
              variant === "danger" && "bg-red-100 text-red-600",
              variant === "info" && "bg-blue-100 text-blue-600",
              variant === "default" && "bg-gray-100 text-gray-600",
            )}>
              {icon}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-20 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
          ) : (
            children
          )}
        </CardContent>
        {footer && (
          <CardFooter className="border-t pt-3 text-xs text-gray-600">
            {footer}
          </CardFooter>
        )}
      </Card>
    );
  }
);

DashboardCard.displayName = "DashboardCard";

export interface MetricCardProps extends DashboardCardProps {
  metric: string | number;
  trend?: {
    value: string | number;
    isPositive?: boolean;
    label?: string;
  };
}

export const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  ({ metric, trend, className, variant, ...props }, ref) => {
    return (
      <DashboardCard
        ref={ref}
        variant={variant}
        className={className}
        {...props}
      >
        <div className="pt-1">
          <p className={cn(metricVariants({ variant }))}>
            {metric}
          </p>
          {trend && (
            <div className="flex items-center mt-1 text-sm">
              <span className={cn(
                "flex items-center",
                trend.isPositive ? "text-green-600" : "text-red-600"
              )}>
                <svg
                  className={cn("h-4 w-4 mr-1", trend.isPositive ? "rotate-0" : "rotate-180")}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 7a1 1 0 01-1-1V4.401l-8.293 8.293a1 1 0 01-1.414-1.414l8.293-8.293H7a1 1 0 010-2h6a1 1 0 011 1v6a1 1 0 01-1 1z"
                    clipRule="evenodd"
                  />
                </svg>
                {trend.value}
              </span>
              {trend.label && (
                <span className="ml-1 text-gray-500">{trend.label}</span>
              )}
            </div>
          )}
        </div>
      </DashboardCard>
    );
  }
);

MetricCard.displayName = "MetricCard";

export interface ActivityCardProps extends DashboardCardProps {
  activities: {
    id: string;
    title: string;
    description?: string;
    timestamp: string;
    icon?: React.ReactNode;
  }[];
}

export const ActivityCard = React.forwardRef<HTMLDivElement, ActivityCardProps>(
  ({ activities, className, variant, ...props }, ref) => {
    return (
      <DashboardCard
        ref={ref}
        variant={variant}
        className={className}
        {...props}
      >
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No recent activities</p>
          ) : (
            <ul className="space-y-3">
              {activities.map((activity) => (
                <li key={activity.id} className="flex gap-3">
                  {activity.icon ? (
                    <div className="mt-0.5">{activity.icon}</div>
                  ) : (
                    <div className="h-2 w-2 mt-1.5 rounded-full bg-primary"></div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.title}</p>
                    {activity.description && (
                      <p className="text-xs text-gray-500 mt-0.5">{activity.description}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DashboardCard>
    );
  }
);

ActivityCard.displayName = "ActivityCard";

export interface AlertCardProps extends DashboardCardProps {
  alertType: "info" | "success" | "warning" | "error";
  message: string;
  actions?: React.ReactNode;
}

export const AlertCard = React.forwardRef<HTMLDivElement, AlertCardProps>(
  ({ alertType, message, actions, className, ...props }, ref) => {
    const alertVariantMap: Record<AlertCardProps['alertType'], DashboardCardProps['variant']> = {
      info: "info",
      success: "success",
      warning: "warning",
      error: "danger"
    };
    
    return (
      <DashboardCard
        ref={ref}
        variant={alertVariantMap[alertType]}
        className={className}
        {...props}
      >
        <div className="py-1">
          <p className="text-sm">{message}</p>
          {actions && (
            <div className="mt-3 flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>
      </DashboardCard>
    );
  }
);

AlertCard.displayName = "AlertCard"; 