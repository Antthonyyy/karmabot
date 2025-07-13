import React from 'react';
import { cn } from '@/lib/utils';

interface AccessibleFormProps {
  children: React.ReactNode;
  className?: string;
  onSubmit?: (e: React.FormEvent) => void;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

export const AccessibleForm = ({ 
  children, 
  className, 
  onSubmit,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  ...props 
}: AccessibleFormProps) => {
  return (
    <form 
      className={cn("space-y-4", className)}
      onSubmit={onSubmit}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      {...props}
    >
      {children}
    </form>
  );
};

interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  description?: string;
  showLabel?: boolean;
  required?: boolean;
}

export const AccessibleInput = React.forwardRef<HTMLInputElement, AccessibleInputProps>(
  ({ 
    label, 
    error, 
    description, 
    showLabel = true, 
    required = false,
    className, 
    id,
    ...props 
  }, ref) => {
    const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const descriptionId = description ? `${inputId}-description` : undefined;

    return (
      <div className="space-y-2">
        {showLabel && (
          <label 
            htmlFor={inputId}
            className={cn(
              "block text-sm font-medium text-foreground",
              required && "after:content-['*'] after:ml-0.5 after:text-red-500"
            )}
          >
            {label}
          </label>
        )}
        
        {description && (
          <p 
            id={descriptionId}
            className="text-sm text-muted-foreground"
          >
            {description}
          </p>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500 focus-visible:ring-red-500",
            className
          )}
          aria-label={!showLabel ? label : undefined}
          aria-describedby={cn(
            descriptionId,
            errorId
          ).trim() || undefined}
          aria-invalid={error ? "true" : "false"}
          aria-required={required}
          {...props}
        />
        
        {error && (
          <p 
            id={errorId}
            className="text-sm text-red-500"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

AccessibleInput.displayName = "AccessibleInput";

interface AccessibleTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  description?: string;
  showLabel?: boolean;
  required?: boolean;
}

export const AccessibleTextarea = React.forwardRef<HTMLTextAreaElement, AccessibleTextareaProps>(
  ({ 
    label, 
    error, 
    description, 
    showLabel = true, 
    required = false,
    className, 
    id,
    ...props 
  }, ref) => {
    const textareaId = id || `textarea-${label.toLowerCase().replace(/\s+/g, '-')}`;
    const errorId = error ? `${textareaId}-error` : undefined;
    const descriptionId = description ? `${textareaId}-description` : undefined;

    return (
      <div className="space-y-2">
        {showLabel && (
          <label 
            htmlFor={textareaId}
            className={cn(
              "block text-sm font-medium text-foreground",
              required && "after:content-['*'] after:ml-0.5 after:text-red-500"
            )}
          >
            {label}
          </label>
        )}
        
        {description && (
          <p 
            id={descriptionId}
            className="text-sm text-muted-foreground"
          >
            {description}
          </p>
        )}
        
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500 focus-visible:ring-red-500",
            className
          )}
          aria-label={!showLabel ? label : undefined}
          aria-describedby={cn(
            descriptionId,
            errorId
          ).trim() || undefined}
          aria-invalid={error ? "true" : "false"}
          aria-required={required}
          {...props}
        />
        
        {error && (
          <p 
            id={errorId}
            className="text-sm text-red-500"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

AccessibleTextarea.displayName = "AccessibleTextarea";

interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingText?: string;
}

export const AccessibleButton = React.forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({ 
    variant = 'primary',
    size = 'md',
    loading = false,
    loadingText = 'Loading...',
    className,
    children,
    disabled,
    ...props 
  }, ref) => {
    const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
    
    const variantClasses = {
      primary: "bg-primary text-primary-foreground hover:bg-primary/90",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      ghost: "hover:bg-accent hover:text-accent-foreground"
    };
    
    const sizeClasses = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 py-2",
      lg: "h-11 px-6 py-2"
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        disabled={disabled || loading}
        aria-describedby={loading ? "loading-state" : undefined}
        {...props}
      >
        {loading && (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-current" />
        )}
        {loading ? loadingText : children}
        {loading && (
          <span id="loading-state" className="sr-only">
            {loadingText}
          </span>
        )}
      </button>
    );
  }
);

AccessibleButton.displayName = "AccessibleButton";

interface VisuallyHiddenProps {
  children: React.ReactNode;
  className?: string;
}

export const VisuallyHidden = ({ children, className }: VisuallyHiddenProps) => (
  <span className={cn("sr-only", className)}>
    {children}
  </span>
);

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export const SkipLink = ({ href, children, className }: SkipLinkProps) => (
  <a
    href={href}
    className={cn(
      "absolute -top-10 left-4 z-50 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all focus:top-4",
      className
    )}
  >
    {children}
  </a>
); 