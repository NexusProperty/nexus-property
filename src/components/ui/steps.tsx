import * as React from 'react';
import { cn } from '@/lib/utils';
import { CheckIcon } from 'lucide-react';

interface StepsProps {
  currentStep: number;
  totalSteps: number;
  children: React.ReactNode;
  className?: string;
}

export function Steps({
  currentStep,
  totalSteps,
  children,
  className,
}: StepsProps) {
  return (
    <div className={cn("flex flex-col space-y-4", className)}>
      <nav aria-label="Progress">
        <ol
          role="list"
          className="space-y-4 md:flex md:space-x-8 md:space-y-0"
        >
          {React.Children.map(children, (child, index) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child as React.ReactElement<StepProps>, {
                step: index + 1,
                active: currentStep === index,
                completed: currentStep > index,
              });
            }
            return child;
          })}
        </ol>
      </nav>
    </div>
  );
}

interface StepProps {
  step: number;
  title: string;
  description?: string;
  active?: boolean;
  completed?: boolean;
  className?: string;
}

export function Step({
  step,
  title,
  description,
  active = false,
  completed = false,
  className,
}: StepProps) {
  return (
    <li className={cn("md:flex-1", className)}>
      <div
        className={cn(
          "flex flex-col border-l-4 py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4",
          {
            "border-primary": active,
            "border-primary/30": completed,
            "border-muted-foreground/30": !active && !completed,
          }
        )}
      >
        <span className="flex items-center text-sm font-medium">
          {completed ? (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
              <CheckIcon className="h-4 w-4 text-primary-foreground" />
            </span>
          ) : (
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full border text-center text-xs font-medium",
                {
                  "border-primary bg-primary text-primary-foreground": active,
                  "border-muted-foreground/30 text-muted-foreground": !active,
                }
              )}
            >
              {step}
            </span>
          )}
          <span 
            className={cn("ml-2", {
              "text-primary": active || completed,
              "text-muted-foreground": !active && !completed,
            })}
          >
            {title}
          </span>
        </span>
        {description && (
          <span 
            className={cn("ml-8 text-sm", {
              "text-muted-foreground": !active,
              "text-foreground": active,
            })}
          >
            {description}
          </span>
        )}
      </div>
    </li>
  );
} 