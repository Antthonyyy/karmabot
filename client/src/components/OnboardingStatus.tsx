import { useUserState } from '@/hooks/useUserState';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Clock } from 'lucide-react';

interface OnboardingStatusProps {
  className?: string;
}

export default function OnboardingStatus({ className = '' }: OnboardingStatusProps) {
  const { user, isLoading } = useUserState();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return null;
  }

  const isCompleted = user.hasCompletedOnboarding;

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isCompleted ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <Clock className="w-4 h-4 text-orange-500" />
            )}
            <span className="font-medium">Налаштування</span>
          </div>
          <Badge 
            variant={isCompleted ? "default" : "secondary"}
            className={isCompleted ? "bg-green-500" : "bg-orange-500"}
          >
            {isCompleted ? 'Завершено' : 'Потрібно'}
          </Badge>
        </div>
        
        <div className="mt-2 text-sm text-gray-600">
          {isCompleted 
            ? 'Ваш акаунт повністю налаштований'
            : 'Завершіть налаштування для повного доступу'
          }
        </div>
      </CardContent>
    </Card>
  );
} 