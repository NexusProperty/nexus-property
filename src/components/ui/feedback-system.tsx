import React, { FC, ReactNode } from "react";
import { Loader2, CheckCircle2, XCircle, AlertCircle, InfoIcon } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { Toast, ToastAction, ToastTitle, ToastDescription } from "@/components/ui/toast";

// Loading Indicator
export interface LoadingIndicatorProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof loadingVariants> {
  text?: string;
}

const loadingVariants = cva(
  "flex items-center justify-center text-center space-x-2",
  {
    variants: {
      size: {
        default: "text-base",
        sm: "text-sm",
        lg: "text-lg",
      },
      fullscreen: {
        true: "fixed inset-0 bg-background/80 backdrop-blur-sm z-50",
        false: "",
      },
    },
    defaultVariants: {
      size: "default",
      fullscreen: false,
    },
  }
);

export const LoadingIndicator: FC<LoadingIndicatorProps> = ({
  className,
  size,
  fullscreen,
  text = "Loading...",
  ...props
}) => (
  <div className={cn(loadingVariants({ size, fullscreen, className }))} {...props}>
    <Loader2 className="h-6 w-6 animate-spin" />
    {text && <span>{text}</span>}
  </div>
);

// Status Messages
export interface StatusMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  variant: "success" | "error" | "warning" | "info";
  title?: string;
  description?: string;
  action?: ReactNode;
  onDismiss?: () => void;
}

export const StatusMessage: FC<StatusMessageProps> = ({
  className,
  variant,
  title,
  description,
  action,
  onDismiss,
  ...props
}) => {
  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
    error: <XCircle className="h-5 w-5 text-destructive" />,
    warning: <AlertCircle className="h-5 w-5 text-amber-500" />,
    info: <InfoIcon className="h-5 w-5 text-blue-500" />,
  };

  const bgColors = {
    success: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900",
    error: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900",
    warning: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900",
    info: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900",
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-md border p-4",
        bgColors[variant],
        className
      )}
      {...props}
    >
      <div className="flex-shrink-0">{icons[variant]}</div>
      <div className="flex-1">
        {title && <h4 className="font-medium">{title}</h4>}
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        {action && <div className="mt-3">{action}</div>}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 rounded-full p-1 hover:bg-background/50"
          aria-label="Dismiss"
        >
          <XCircle className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );
};

// Toast Notifications
export type ToastVariant = "default" | "success" | "error" | "warning" | "info";

export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

export const useFeedback = () => {
  const { toast } = useToast();

  const showToast = ({ title, description, variant = "default", action, duration }: ToastOptions) => {
    const variantClassNames = {
      success: "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30",
      error: "border-destructive bg-red-50 dark:bg-red-950/30",
      warning: "border-amber-500 bg-amber-50 dark:bg-amber-950/30",
      info: "border-blue-500 bg-blue-50 dark:bg-blue-950/30",
      default: "",
    };

    const iconMap = {
      success: <CheckCircle2 className="h-5 w-5 text-emerald-500 mr-2" />,
      error: <XCircle className="h-5 w-5 text-destructive mr-2" />,
      warning: <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />,
      info: <InfoIcon className="h-5 w-5 text-blue-500 mr-2" />,
      default: null,
    };

    return toast({
      title,
      description: description && (
        <>
          {variant !== "default" && iconMap[variant]}
          {description}
        </>
      ),
      className: variant !== "default" ? variantClassNames[variant] : undefined,
      duration: duration,
      action: action
        ? <ToastAction altText={action.label} onClick={action.onClick}>
            {action.label}
          </ToastAction>
        : undefined,
    });
  };

  return {
    toast: showToast,
    success: (options: Omit<ToastOptions, "variant">) => 
      showToast({ ...options, variant: "success" }),
    error: (options: Omit<ToastOptions, "variant">) => 
      showToast({ ...options, variant: "error" }),
    warning: (options: Omit<ToastOptions, "variant">) => 
      showToast({ ...options, variant: "warning" }),
    info: (options: Omit<ToastOptions, "variant">) => 
      showToast({ ...options, variant: "info" }),
  };
};

// Inline Loading Component
export interface InlineLoadingProps {
  text?: string;
  className?: string;
}

export const InlineLoading: FC<InlineLoadingProps> = ({ text = "Loading", className }) => (
  <div className={cn("flex items-center text-sm text-muted-foreground", className)}>
    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
    {text}
  </div>
);

// Page Loading Overlay
export const PageLoading: FC<{ text?: string }> = ({ text = "Loading page..." }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
    <div className="flex flex-col items-center justify-center space-y-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-lg font-medium text-muted-foreground">{text}</p>
    </div>
  </div>
);

// Button Loading State
export const ButtonLoading: FC = () => (
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
); 