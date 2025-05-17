import * as React from "react";
import { useForm, FormProvider, Controller, FieldValues, UseFormReturn, SubmitHandler, FieldErrors, Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AlertCircle, Check } from "lucide-react";

// Import utility functions from their dedicated location
import { createFormSchema, useZodForm } from "@/lib/form-utils/form-utils";

// Form Context Component
interface FormContextProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  children: React.ReactNode;
  onSubmit: SubmitHandler<T>;
  className?: string;
}

export function FormContext<T extends FieldValues>({
  form,
  children,
  onSubmit,
  className,
}: FormContextProps<T>) {
  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={cn("space-y-6", className)}>
        {children}
      </form>
    </FormProvider>
  );
}

// Form Field Component
interface FormFieldProps {
  name: string;
  label: string;
  type?: "text" | "email" | "password" | "number" | "tel" | "url" | "date";
  placeholder?: string;
  required?: boolean;
  className?: string;
  description?: string;
  disabled?: boolean;
  defaultValue?: string;
  validation?: z.ZodType<string>;
  form?: UseFormReturn<Record<string, unknown>>;
}

export function FormField({
  name,
  label,
  type = "text",
  placeholder,
  required = false,
  className,
  description,
  disabled = false,
  defaultValue = "",
  validation,
  form: externalForm,
}: FormFieldProps) {
  // Create a schema for this field if validation is not provided
  const fieldSchema = validation || 
    (required ? z.string().min(1, "This field is required") : z.string().optional());
  
  // Create a form specific to this field if not provided externally
  const internalForm = useForm({
    resolver: zodResolver(z.object({ [name]: fieldSchema })),
    defaultValues: { [name]: defaultValue }
  });
  
  // Use either the externally provided form or the internal one
  const form = externalForm || internalForm;
  const { register, formState: { errors } } = form;
  
  return (
    <div className={cn("space-y-2", className)}>
      <div className="space-y-1">
        <Label htmlFor={name} className="text-sm font-medium">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <Input
        id={name}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(errors[name] && "border-destructive")}
        {...register(name, { required })}
      />
      {errors[name] && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {errors[name]?.message?.toString() || "This field is required"}
        </p>
      )}
    </div>
  );
}

// Text Area Component
interface FormTextareaProps {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  description?: string;
  disabled?: boolean;
  defaultValue?: string;
  rows?: number;
  validation?: z.ZodType<string>;
  form?: UseFormReturn<Record<string, unknown>>;
}

export function FormTextarea({
  name,
  label,
  placeholder,
  required = false,
  className,
  description,
  disabled = false,
  defaultValue = "",
  rows = 3,
  validation,
  form: externalForm,
}: FormTextareaProps) {
  // Create a schema for this field if validation is not provided
  const fieldSchema = validation || 
    (required ? z.string().min(1, "This field is required") : z.string().optional());
  
  // Create a form specific to this field if not provided externally
  const internalForm = useForm({
    resolver: zodResolver(z.object({ [name]: fieldSchema })),
    defaultValues: { [name]: defaultValue }
  });
  
  // Use either the externally provided form or the internal one
  const form = externalForm || internalForm;
  const { register, formState: { errors } } = form;
  
  return (
    <div className={cn("space-y-2", className)}>
      <div className="space-y-1">
        <Label htmlFor={name} className="text-sm font-medium">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <Textarea
        id={name}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={cn(errors[name] && "border-destructive")}
        {...register(name, { required })}
      />
      {errors[name] && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {errors[name]?.message?.toString() || "This field is required"}
        </p>
      )}
    </div>
  );
}

// Checkbox Component
interface FormCheckboxProps {
  name: string;
  label: string;
  required?: boolean;
  className?: string;
  description?: string;
  disabled?: boolean;
  defaultChecked?: boolean;
  validation?: z.ZodType<boolean>;
  form?: UseFormReturn<Record<string, unknown>>;
}

export function FormCheckbox({
  name,
  label,
  required = false,
  className,
  description,
  disabled = false,
  defaultChecked = false,
  validation,
  form: externalForm,
}: FormCheckboxProps) {
  // Create a schema for this field if validation is not provided
  const fieldSchema = validation || 
    (required ? z.boolean().refine(val => val === true, "This field is required") : z.boolean().optional());
  
  // Create a form specific to this field if not provided externally
  const internalForm = useForm<Record<string, boolean>>({
    resolver: zodResolver(z.object({ [name]: fieldSchema })),
    defaultValues: { [name]: defaultChecked }
  });
  
  // Use either the externally provided form or the internal one
  const form = externalForm || internalForm;
  const { control, formState: { errors } } = form;
  
  return (
    <div className={cn("space-y-2", className)}>
      <Controller
        name={name}
        control={control as unknown as Control<Record<string, boolean>>}
        defaultValue={defaultChecked}
        render={({ field }) => (
          <div className="flex items-start space-x-2">
            <Checkbox
              id={name}
              checked={field.value as boolean}
              onCheckedChange={field.onChange}
              disabled={disabled}
              className="mt-1"
            />
            <div className="space-y-1 leading-none">
              <Label htmlFor={name} className="text-sm font-medium">
                {label} {required && <span className="text-destructive">*</span>}
              </Label>
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
        )}
      />
      {errors[name] && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {errors[name]?.message?.toString() || "This field is required"}
        </p>
      )}
    </div>
  );
}

// Radio Group Component
interface FormRadioGroupProps {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  required?: boolean;
  className?: string;
  description?: string;
  disabled?: boolean;
  defaultValue?: string;
  validation?: z.ZodType<string>;
  form?: UseFormReturn<Record<string, unknown>>;
}

export function FormRadioGroup({
  name,
  label,
  options,
  required = false,
  className,
  description,
  disabled = false,
  defaultValue = "",
  validation,
  form: externalForm,
}: FormRadioGroupProps) {
  // Create a schema for this field if validation is not provided
  const fieldSchema = validation || 
    (required ? z.string().min(1, "This option is required") : z.string().optional());
  
  // Create a form specific to this field if not provided externally
  const internalForm = useForm<Record<string, string>>({
    resolver: zodResolver(z.object({ [name]: fieldSchema })),
    defaultValues: { [name]: defaultValue }
  });
  
  // Use either the externally provided form or the internal one
  const form = externalForm || internalForm;
  const { control, formState: { errors } } = form;
  
  return (
    <div className={cn("space-y-2", className)}>
      <div className="space-y-1">
        <Label className="text-sm font-medium">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <Controller
        name={name}
        control={control as unknown as Control<Record<string, string>>}
        defaultValue={defaultValue}
        render={({ field }) => (
          <RadioGroup
            onValueChange={field.onChange}
            defaultValue={field.value as string}
            disabled={disabled}
            className="flex flex-col space-y-1"
          >
            {options.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`${name}-${option.value}`} />
                <Label htmlFor={`${name}-${option.value}`}>{option.label}</Label>
              </div>
            ))}
          </RadioGroup>
        )}
      />
      {errors[name] && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {errors[name]?.message?.toString() || "This field is required"}
        </p>
      )}
    </div>
  );
}

// Select Component
interface FormSelectProps {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  required?: boolean;
  className?: string;
  description?: string;
  disabled?: boolean;
  defaultValue?: string;
  placeholder?: string;
  validation?: z.ZodType<string>;
  form?: UseFormReturn<Record<string, unknown>>;
}

export function FormSelect({
  name,
  label,
  options,
  required = false,
  className,
  description,
  disabled = false,
  defaultValue = "",
  placeholder = "Select an option",
  validation,
  form: externalForm,
}: FormSelectProps) {
  // Create a schema for this field if validation is not provided
  const fieldSchema = validation || 
    (required ? z.string().min(1, "Please select an option") : z.string().optional());
  
  // Create a form specific to this field if not provided externally
  const internalForm = useForm<Record<string, string>>({
    resolver: zodResolver(z.object({ [name]: fieldSchema })),
    defaultValues: { [name]: defaultValue }
  });
  
  // Use either the externally provided form or the internal one
  const form = externalForm || internalForm;
  const { control, formState: { errors } } = form;
  
  return (
    <div className={cn("space-y-2", className)}>
      <div className="space-y-1">
        <Label htmlFor={name} className="text-sm font-medium">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <Controller
        name={name}
        control={control as unknown as Control<Record<string, string>>}
        defaultValue={defaultValue}
        render={({ field }) => (
          <Select
            onValueChange={field.onChange}
            defaultValue={field.value as string}
            disabled={disabled}
          >
            <SelectTrigger id={name} className={cn(errors[name] && "border-destructive")}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      {errors[name] && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {errors[name]?.message?.toString() || "This field is required"}
        </p>
      )}
    </div>
  );
}

// Form Actions Component
interface FormActionsProps {
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  isSubmitting?: boolean;
  className?: string;
}

export function FormActions({
  submitLabel = "Submit",
  cancelLabel = "Cancel",
  onCancel,
  isSubmitting = false,
  className,
}: FormActionsProps) {
  return (
    <div className={cn("flex items-center justify-end space-x-2", className)}>
      {onCancel && (
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {cancelLabel}
        </Button>
      )}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <span className="flex items-center gap-1">
            Processing <span className="animate-spin">...</span>
          </span>
        ) : (
          <span className="flex items-center gap-1">
            {submitLabel} <Check className="h-4 w-4" />
          </span>
        )}
      </Button>
    </div>
  );
}

/**
 * Component to display form errors
 */
export function FormErrors({ errors }: { errors: FieldErrors }) {
  if (Object.keys(errors).length === 0) return null;
  
  return (
    <div className="bg-destructive/10 text-destructive rounded-md p-3 space-y-1 mb-4">
      <h4 className="font-medium flex items-center gap-1">
        <AlertCircle className="h-4 w-4" />
        Please fix the following errors:
      </h4>
      <ul className="list-disc pl-5">
        {Object.entries(errors).map(([field, error]) => (
          <li key={field}>
            <span className="font-medium">{field}:</span>{" "}
            {error?.message?.toString()}
          </li>
        ))}
      </ul>
    </div>
  );
} 