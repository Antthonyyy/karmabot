import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Crown, Zap, Star } from 'lucide-react';
import { authUtils } from '@/utils/auth';
import { apiRequest } from '@/lib/queryClient';

interface SubscriptionStatusProps {
  className?: string;
}

export default function SubscriptionStatus({ className = '' }: SubscriptionStatusProps) {
  const { data: subscription, isLoading } = useQuery({
    queryKey: ['current-subscription'],
    queryFn: async () => {
      const response = await apiRequest('/api/subscriptions/current', { method: 'GET' });
      if (!response.ok) throw new Error('Failed to fetch subscription');
      return response.json();
    },
    enabled: !!authUtils.getToken(),
  });

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

  if (!subscription) {
    return null;
  }

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'pro':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'plus':
        return <Zap className="w-4 h-4 text-blue-500" />;
      case 'light':
        return <Star className="w-4 h-4 text-green-500" />;
      default:
        return null;
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'pro':
        return 'bg-gradient-to-r from-yellow-400 to-orange-500';
      case 'plus':
        return 'bg-gradient-to-r from-blue-400 to-purple-500';
      case 'light':
        return 'bg-gradient-to-r from-green-400 to-emerald-500';
      default:
        return 'bg-gray-200';
    }
  };

  const getPlanName = (plan: string) => {
    switch (plan) {
      case 'pro':
        return 'Pro';
      case 'plus':
        return 'Plus';
      case 'light':
        return 'Light';
      default:
        return 'Free';
    }
  };

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getPlanIcon(subscription.plan)}
            <span className="font-medium">Підписка</span>
          </div>
          <Badge className={`${getPlanColor(subscription.plan)} text-white`}>
            {getPlanName(subscription.plan)}
          </Badge>
        </div>
        
        {subscription.expiresAt && (
          <div className="mt-2 text-sm text-gray-600">
            Діє до: {new Date(subscription.expiresAt).toLocaleDateString('uk-UA')}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 