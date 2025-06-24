import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Crown, Zap, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authUtils } from '@/utils/auth';
import { useToast } from '@/hooks/use-toast';
import { BackButton } from '@/components/BackButton';

interface Plan {
  id: string;
  name: string;
  monthly: number;
  yearly: number;
  currency: string;
  features: string[];
}

interface Subscription {
  plan: string;
  startDate: string | null;
  endDate: string | null;
  features: any;
}

export default function SubscriptionsPage() {
  const { t } = useTranslation('subscriptions');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const response = await fetch('/api/subscriptions/plans');
      if (!response.ok) throw new Error('Failed to fetch plans');
      return response.json() as Promise<Plan[]>;
    }
  });

  const { data: currentSubscription } = useQuery({
    queryKey: ['current-subscription'],
    queryFn: async () => {
      const response = await fetch('/api/subscriptions/current', {
        headers: authUtils.getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch subscription');
      return response.json() as Promise<Subscription>;
    }
  });

  const subscribeMutation = useMutation({
    mutationFn: async ({ planId, billingPeriod }: { planId: string; billingPeriod: string }) => {
      const response = await fetch('/api/subscriptions/subscribe', {
        method: 'POST',
        headers: authUtils.getAuthHeaders(),
        body: JSON.stringify({ planId, billingPeriod })
      });
      if (!response.ok) throw new Error('Failed to create subscription');
      return response.json();
    },
    onSuccess: (data) => {
      // Redirect to payment
      window.open(data.paymentUrl, '_blank');
      toast({
        title: "Переходимо до оплати",
        description: "Відкрито сторінку для оплати підписки"
      });
    },
    onError: (error) => {
      toast({
        title: "Помилка",
        description: "Не вдалося створити підписку",
        variant: "destructive"
      });
    }
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: authUtils.getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to cancel subscription');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-subscription'] });
      toast({
        title: "Підписку скасовано",
        description: "Ваша підписка була успішно скасована"
      });
    }
  });

  const handleSubscribe = (planId: string) => {
    subscribeMutation.mutate({ planId, billingPeriod });
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'light': return <Zap className="w-6 h-6" />;
      case 'plus': return <Star className="w-6 h-6" />;
      case 'pro': return <Crown className="w-6 h-6" />;
      default: return null;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'light': return 'border-blue-200 bg-blue-50';
      case 'plus': return 'border-purple-200 bg-purple-50';
      case 'pro': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  if (plansLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Завантаження планів...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <BackButton />
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('title', 'Обери свій план')}
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            {t('description', 'Розблокуй потенціал для розвитку карми')}
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <span className={billingPeriod === 'monthly' ? 'font-semibold' : 'text-gray-500'}>
              {t('billing.monthly', 'Щомісячно')}
            </span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                billingPeriod === 'yearly' ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billingPeriod === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={billingPeriod === 'yearly' ? 'font-semibold' : 'text-gray-500'}>
              {t('billing.yearly', 'Щорічно')}
            </span>
            {billingPeriod === 'yearly' && (
              <Badge variant="secondary" className="ml-2">
                {t('billing.yearlyDiscount', 'Знижка 16%')}
              </Badge>
            )}
          </div>
        </div>

        {/* Current Subscription */}
        {currentSubscription && currentSubscription.plan !== 'none' && (
          <div className="mb-8">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-green-800">
                      {t('plans.current', 'Поточний план')}: {currentSubscription.plan}
                    </h3>
                    {currentSubscription.endDate && (
                      <p className="text-green-600">
                        Діє до: {new Date(currentSubscription.endDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => cancelMutation.mutate()}
                    disabled={cancelMutation.isPending}
                  >
                    Скасувати підписку
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {plans?.map((plan) => (
            <Card
              key={plan.id}
              className={`relative ${getPlanColor(plan.id)} ${
                plan.id === 'plus' ? 'ring-2 ring-purple-400 scale-105' : ''
              }`}
            >
              {plan.id === 'plus' && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-purple-600 text-white">
                    {t('popularBadge', 'Популярний')}
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  {getPlanIcon(plan.id)}
                </div>
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <div className="text-4xl font-bold">
                  €{billingPeriod === 'monthly' ? plan.monthly : plan.yearly}
                  <span className="text-lg font-normal text-gray-600">
                    /{billingPeriod === 'monthly' ? 'міс' : 'рік'}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={subscribeMutation.isPending || currentSubscription?.plan === plan.id}
                  variant={plan.id === 'plus' ? 'default' : 'outline'}
                >
                  {currentSubscription?.plan === plan.id
                    ? t('plans.current', 'Поточний план')
                    : t('plans.select', 'Обрати {{plan}}', { plan: plan.name })
                  }
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Guarantee */}
        <div className="text-center mt-12">
          <p className="text-gray-600">
            {t('guarantee', '7-денна гарантія повернення коштів')}
          </p>
        </div>
      </div>
    </div>
  );
}