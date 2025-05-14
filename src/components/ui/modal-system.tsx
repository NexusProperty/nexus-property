import React, { ReactNode, forwardRef } from "react";
import { Check, AlertCircle, Info, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Base Modal Props
interface BaseModalProps {
  title: string;
  description?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children?: ReactNode;
  className?: string;
}

// Confirmation Modal Props
interface ConfirmationModalProps extends BaseModalProps {
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "success" | "info";
  onConfirm: () => Promise<void> | void;
  onCancel?: () => void;
  isLoading?: boolean;
}

// Form Modal Props
interface FormModalProps extends BaseModalProps {
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit: () => Promise<void> | void;
  onCancel?: () => void;
  isLoading?: boolean;
}

// Information Modal Props
interface InformationModalProps extends BaseModalProps {
  closeLabel?: string;
  variant?: "info" | "success" | "warning" | "danger";
  onClose?: () => void;
}

// Base Modal Component
const BaseModal = forwardRef<HTMLDivElement, BaseModalProps>(
  ({ title, description, open, onOpenChange, children, className }, ref) => {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          ref={ref} 
          className={cn("sm:max-w-[425px]", className)}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    );
  }
);
BaseModal.displayName = "BaseModal";

// Confirmation Modal Component
export function ConfirmationModal({
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "info",
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  children,
  className,
  isLoading = false,
}: ConfirmationModalProps) {
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onOpenChange(false);
  };

  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  const iconMap = {
    danger: <AlertCircle className="h-6 w-6 text-destructive" />,
    warning: <AlertCircle className="h-6 w-6 text-amber-500" />,
    success: <Check className="h-6 w-6 text-emerald-500" />,
    info: <Info className="h-6 w-6 text-blue-500" />,
  };

  const buttonVariantMap: Record<ConfirmationModalProps["variant"], ButtonProps["variant"]> = {
    danger: "destructive",
    warning: "outline",
    success: "default",
    info: "secondary",
  };

  return (
    <BaseModal
      title={title}
      description={description}
      open={open}
      onOpenChange={onOpenChange}
      className={className}
    >
      <div className="flex items-center gap-4 py-4">
        {iconMap[variant]}
        <div>{children}</div>
      </div>
      <DialogFooter className="gap-2 sm:gap-0">
        <Button variant="outline" onClick={handleCancel}>
          {cancelLabel}
        </Button>
        <Button 
          variant={buttonVariantMap[variant]} 
          onClick={handleConfirm}
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : confirmLabel}
        </Button>
      </DialogFooter>
    </BaseModal>
  );
}

// Form Modal Component
export function FormModal({
  title,
  description,
  submitLabel = "Submit",
  cancelLabel = "Cancel",
  open,
  onOpenChange,
  onSubmit,
  onCancel,
  children,
  className,
  isLoading = false,
}: FormModalProps) {
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    await onSubmit();
    onOpenChange(false);
  };

  return (
    <BaseModal
      title={title}
      description={description}
      open={open}
      onOpenChange={onOpenChange}
      className={className}
    >
      <div className="py-4">{children}</div>
      <DialogFooter className="gap-2 sm:gap-0">
        <Button variant="outline" onClick={handleCancel}>
          {cancelLabel}
        </Button>
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? "Loading..." : submitLabel}
        </Button>
      </DialogFooter>
    </BaseModal>
  );
}

// Information Modal Component
export function InformationModal({
  title,
  description,
  closeLabel = "Close",
  variant = "info",
  open,
  onOpenChange,
  onClose,
  children,
  className,
}: InformationModalProps) {
  const handleClose = () => {
    if (onClose) {
      onClose();
    }
    onOpenChange(false);
  };

  const iconMap = {
    info: <Info className="h-6 w-6 text-blue-500" />,
    success: <Check className="h-6 w-6 text-emerald-500" />,
    warning: <AlertCircle className="h-6 w-6 text-amber-500" />,
    danger: <AlertCircle className="h-6 w-6 text-destructive" />,
  };

  return (
    <BaseModal
      title={title}
      description={description}
      open={open}
      onOpenChange={onOpenChange}
      className={className}
    >
      <div className="flex items-start gap-4 py-4">
        {iconMap[variant]}
        <div>{children}</div>
      </div>
      <DialogFooter>
        <Button onClick={handleClose}>{closeLabel}</Button>
      </DialogFooter>
    </BaseModal>
  );
} 