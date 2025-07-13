import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse' | 'bounce';
  className?: string;
  text?: string;
  color?: 'primary' | 'secondary' | 'muted';
  fullScreen?: boolean;
}

export default function LoadingSpinner({ 
  size = 'md', 
  variant = 'spinner',
  className = '',
  text,
  color = 'primary',
  fullScreen = false
}: LoadingSpinnerProps) {
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const colorClasses = {
    primary: 'border-violet-500 bg-violet-500',
    secondary: 'border-blue-500 bg-blue-500',
    muted: 'border-gray-400 bg-gray-400'
  };

  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const renderSpinner = () => {
    switch (variant) {
      case 'spinner':
        return (
          <div 
            className={cn(
              'animate-spin rounded-full border-2 border-transparent border-t-current',
              sizeClasses[size],
              colorClasses[color]
            )}
            role="status"
            aria-label="Loading"
          />
        );
      
      case 'dots':
        return (
          <div className="flex space-x-1" role="status" aria-label="Loading">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  'rounded-full animate-bounce',
                  sizeClasses[size],
                  colorClasses[color]
                )}
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '1.4s'
                }}
              />
            ))}
          </div>
        );
      
      case 'pulse':
        return (
          <div
            className={cn(
              'rounded-full animate-pulse',
              sizeClasses[size],
              colorClasses[color]
            )}
            role="status"
            aria-label="Loading"
          />
        );
      
      case 'bounce':
        return (
          <div
            className={cn(
              'rounded-full animate-bounce',
              sizeClasses[size],
              colorClasses[color]
            )}
            role="status"
            aria-label="Loading"
          />
        );
      
      default:
        return null;
    }
  };

  const content = (
    <div className={cn(
      'flex flex-col items-center justify-center space-y-3',
      fullScreen ? 'min-h-screen' : '',
      className
    )}>
      {renderSpinner()}
      {text && (
        <p className={cn(
          'text-muted-foreground animate-pulse',
          textSizeClasses[size]
        )}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return content;
} 