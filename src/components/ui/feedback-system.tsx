import React, { FC, ReactNode } from "react";
import { Loader2, CheckCircle2, XCircle, AlertCircle, InfoIcon } from "lucide-react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { ToastAction } from "@/components/ui/toast";

// Import types, variants, and utilities from separated files
import { loadingVariants } from "@/lib/ui-variants/loading-variants";
import { 
  ToastVariant, 
  StatusMessageVariant, 
  getStatusIconMap, 
  getStatusBackgroundColors, 
  getToastClassNames,
  getToastIconMap 
} from "@/lib/ui-variants/feedback-variants";
import { useFeedbackHook } from "@/lib/hooks/use-feedback";

// Loading Indicator
export interface LoadingIndicatorProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof loadingVariants> {
  text?: string;
}

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
  variant: StatusMessageVariant;
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
  const icons = getStatusIconMap();
  const bgColors = getStatusBackgroundColors();

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

// Export useFeedback hook as a named export
export const useFeedback = useFeedbackHook;

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