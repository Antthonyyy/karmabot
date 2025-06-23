import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Lock } from 'lucide-react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';

interface SubscriptionRequiredProps {
  feature: string;
  requiredPlan: 'light' | 'plus' | 'pro';
  description?: string;
}

export function SubscriptionRequired({ feature, requiredPlan, description }: SubscriptionRequiredProps) {
  const [, setLocation] = useLocation();
  const { t } = useTranslation('subscriptions');

  const planNames = {
    light: 'Карма Лайт',
    plus: 'Карма Плюс', 
    pro: 'Карма Про'
  };

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