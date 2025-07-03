import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Lock, Clock } from 'lucide-react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { authUtils } from '@/utils/auth';

interface SubscriptionRequiredProps {
  feature: string;
  requiredPlan: 'light' | 'plus' | 'pro';
  description?: string;
}

interface CurrentSubscription {
  plan: 'trial' | 'light' | 'plus' | 'pro' | 'none';
  expiresAt: string | null;
  status: string;
}

export function SubscriptionRequired({ feature, requiredPlan, description }: SubscriptionRequiredProps) {
  const [, setLocation] = useLocation();
  const { t } = useTranslation('subscriptions');

  const { data: currentSub } = useQuery<CurrentSubscription>({
    queryKey: ['current-subscription'],
    queryFn: async () => {
      const response = await fetch('/api/subscriptions/current', {
        headers: authUtils.getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch subscription');
      return response.json();
    }
  });

  const planNames = {
    light: 'Карма Лайт',
    plus: 'Карма Плюс', 
    pro: 'Карма Про'
  };

  // Calculate days remaining for trial
  const getDaysRemaining = () => {
    if (!currentSub?.expiresAt) return 0;
    const now = new Date();
    const expires = new Date(currentSub.expiresAt);
    const diffTime = expires.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const isTrialActive = currentSub?.plan === 'trial' && currentSub?.status === 'active';
  const daysRemaining = getDaysRemaining();

  if (isTrialActive) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-blue-800">
            Пробний період
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-blue-700 mb-4">
            У вас залишилось <strong>{daysRemaining} {daysRemaining === 1 ? 'день' : daysRemaining < 5 ? 'дні' : 'днів'}</strong> безкоштовного доступу до всіх функцій.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => setLocation('/subscriptions')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Crown className="w-4 h-4 mr-2" />
              Оберіть план
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-orange-100 rounded-full">
            <Lock className="w-8 h-8 text-orange-600" />
          </div>
        </div>
        <CardTitle className="text-orange-800">
          {t('upgrade.required', 'Потрібне оновлення')}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-orange-700 mb-4">
          {description || `Функція "${feature}" доступна тільки в тарифі ${planNames[requiredPlan]} та вище.`}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => setLocation('/subscriptions')}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Crown className="w-4 h-4 mr-2" />
            {t('upgrade.button', 'Оновити план')}
          </Button>
          <Button variant="outline">
            {t('upgrade.learn', 'Дізнатися більше')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}