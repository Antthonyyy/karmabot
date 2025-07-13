import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'pulse' | 'wave';
  animate?: boolean;
}

function Skeleton({ 
  className, 
  variant = 'default',
  animate = true,
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & SkeletonProps) {
  const baseClasses = "bg-muted rounded-md";
  
  const variantClasses = {
    default: "bg-gradient-to-r from-muted via-muted/50 to-muted",
    pulse: "bg-muted",
    wave: "bg-gradient-to-r from-muted via-muted/30 to-muted",
  };

  const animationClasses = {
    default: animate ? "animate-pulse" : "",
    pulse: animate ? "animate-pulse" : "",
    wave: animate ? "animate-shimmer" : "",
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        animationClasses[variant],
        className
      )}
      {...props}
    />
  );
}

// Predefined skeleton components for common use cases
export const SkeletonCard = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-6 space-y-3", className)} {...props}>
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
    <Skeleton className="h-4 w-2/3" />
  </div>
);

export const SkeletonAvatar = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <Skeleton className={cn("h-10 w-10 rounded-full", className)} {...props} />
);

export const SkeletonButton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <Skeleton className={cn("h-10 w-24 rounded-md", className)} {...props} />
);

export const SkeletonInput = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <Skeleton className={cn("h-10 w-full rounded-md", className)} {...props} />
);

export const SkeletonText = ({ 
  lines = 3, 
  className, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & { lines?: number }) => (
  <div className={cn("space-y-2", className)} {...props}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton 
        key={i} 
        className={cn(
          "h-4",
          i === lines - 1 ? "w-2/3" : "w-full"
        )} 
      />
    ))}
  </div>
);

export const SkeletonList = ({ 
  items = 5, 
  className, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & { items?: number }) => (
  <div className={cn("space-y-3", className)} {...props}>
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex items-center space-x-3">
        <SkeletonAvatar className="h-8 w-8" />
        <div className="space-y-1 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonChart = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("space-y-4", className)} {...props}>
    <Skeleton className="h-6 w-1/3" />
    <Skeleton className="h-64 w-full" />
    <div className="flex justify-between">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-16" />
    </div>
  </div>
);

export const SkeletonTable = ({ 
  rows = 5, 
  cols = 4, 
  className, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & { rows?: number; cols?: number }) => (
  <div className={cn("space-y-3", className)} {...props}>
    {/* Header */}
    <div className="flex space-x-3">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex space-x-3">
        {Array.from({ length: cols }).map((_, j) => (
          <Skeleton key={j} className="h-4 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

export { Skeleton };
