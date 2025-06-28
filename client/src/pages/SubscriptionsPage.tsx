import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { CheckCircle, Crown, Zap, Star, Sparkles, MessageCircle, TrendingUp, Download, Shield, ArrowRight, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authUtils } from '@/utils/auth';
import { useToast } from '@/hooks/use-toast';
import { BackButton } from '@/components/BackButton';
import { ScaleTransition, FadeTransition } from '@/components/PageTransition';

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
      case 'light': return <Zap className="w-8 h-8 text-blue-600" />;
      case 'plus': return <Star className="w-8 h-8 text-purple-600" />;
      case 'pro': return <Crown className="w-8 h-8 text-yellow-600" />;
      default: return null;
    }
  };

  const getPlanGradient = (planId: string) => {
    switch (planId) {
      case 'light': return 'from-blue-50 to-blue-100 border-blue-200';
      case 'plus': return 'from-purple-50 to-purple-100 border-purple-300';
      case 'pro': return 'from-yellow-50 to-yellow-100 border-yellow-300';
      default: return 'from-gray-50 to-gray-100 border-gray-200';
    }
  };

  const getPlanFeatureIcon = (feature: string) => {
    if (feature.includes('AI') || feature.includes('поради')) return <MessageCircle className="w-4 h-4" />;
    if (feature.includes('статистика') || feature.includes('аналітика')) return <TrendingUp className="w-4 h-4" />;
    if (feature.includes('експорт') || feature.includes('Експорт')) return <Download className="w-4 h-4" />;
    if (feature.includes('геймификація') || feature.includes('досягнення')) return <Star className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  if (plansLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <FadeTransition>
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"
            />
            <p className="mt-4 text-gray-600 font-medium">Завантаження планів...</p>
          </div>
        </FadeTransition>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <FadeTransition>
          <BackButton />
          
          {/* Hero Section */}
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl">
                  <Sparkles className="w-12 h-12 text-white" />
                </div>
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
                {t('title', 'Обери свій план')}
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                {t('description', 'Розблокуй потенціал для розвитку карми з AI-помічником, розширеною аналітикою та персональними рекомендаціями')}
              </p>
            </motion.div>

            {/* Enhanced Billing Toggle */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex items-center justify-center space-x-6 mb-8"
            >
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center space-x-4">
                  <span className={`font-medium transition-colors ${billingPeriod === 'monthly' ? 'text-blue-600' : 'text-gray-500'}`}>
                    {t('billing.monthly', 'Щомісячно')}
                  </span>
                  <Switch
                    checked={billingPeriod === 'yearly'}
                    onCheckedChange={(checked) => setBillingPeriod(checked ? 'yearly' : 'monthly')}
                    className="data-[state=checked]:bg-blue-600"
                  />
                  <span className={`font-medium transition-colors ${billingPeriod === 'yearly' ? 'text-blue-600' : 'text-gray-500'}`}>
                    {t('billing.yearly', 'Щорічно')}
                  </span>
                  <AnimatePresence>
                    {billingPeriod === 'yearly' && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, x: -10 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8, x: -10 }}
                        className="flex items-center"
                      >
                        <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 ml-2">
                          <Sparkles className="w-3 h-3 mr-1" />
                          {t('billing.yearlyDiscount', 'Знижка 16%')}
                        </Badge>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>
        </FadeTransition>

        {/* Current Subscription */}
        <AnimatePresence>
          {currentSubscription && currentSubscription.plan !== 'none' && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-12"
            >
              <Card className="border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-green-100 rounded-full">
                        <Shield className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-green-800 flex items-center">
                          {t('plans.current', 'Поточний план')}: {currentSubscription.plan}
                          <Badge className="ml-2 bg-green-600 text-white">
                            Активна
                          </Badge>
                        </h3>
                        {currentSubscription.endDate && (
                          <p className="text-green-600">
                            Діє до: {new Date(currentSubscription.endDate).toLocaleDateString('uk-UA')}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => cancelMutation.mutate()}
                      disabled={cancelMutation.isPending}
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      {cancelMutation.isPending ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full mr-2"
                        />
                      ) : (
                        <X className="w-4 h-4 mr-2" />
                      )}
                      Скасувати підписку
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans?.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative ${plan.id === 'plus' ? 'scale-105 z-10' : ''}`}
            >
              <Card
                className={`relative bg-gradient-to-br ${getPlanGradient(plan.id)} shadow-xl hover:shadow-2xl transition-all duration-300 border-2 ${
                  plan.id === 'plus' ? 'ring-4 ring-purple-300 ring-opacity-50' : ''
                } overflow-hidden group`}
              >
                {/* Популярний бейдж */}
                {plan.id === 'plus' && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20"
                  >
                    <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 text-sm font-bold shadow-lg">
                      <Star className="w-4 h-4 mr-2" />
                      {t('popularBadge', 'Найпопулярніший')}
                    </Badge>
                  </motion.div>
                )}

                {/* Декоративний градієнт */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <CardHeader className="text-center pb-6 pt-8">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="flex justify-center mb-6"
                  >
                    <div className="p-4 bg-white rounded-2xl shadow-lg">
                      {getPlanIcon(plan.id)}
                    </div>
                  </motion.div>
                  
                  <CardTitle className="text-2xl font-bold text-gray-800 mb-4">
                    {plan.name}
                  </CardTitle>
                  
                  {/* Ціна з анімацією */}
                  <div className="text-center">
                    <motion.div
                      key={billingPeriod}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-5xl font-bold text-gray-900"
                    >
                      €{billingPeriod === 'monthly' ? plan.monthly : plan.yearly}
                    </motion.div>
                    <div className="text-lg text-gray-600 mt-1">
                      /{billingPeriod === 'monthly' ? 'місяць' : 'рік'}
                    </div>
                    {billingPeriod === 'yearly' && (
                      <div className="text-sm text-green-600 font-medium mt-2">
                        Економія €{(plan.monthly * 12) - plan.yearly} на рік
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-0 pb-8">
                  {/* Список функцій */}
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, idx) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: (index * 0.1) + (idx * 0.05) }}
                        className="flex items-center space-x-3"
                      >
                        <div className="flex-shrink-0">
                          <div className="p-1 bg-green-100 rounded-full">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </div>
                        </div>
                        <span className="text-gray-700 font-medium">{feature}</span>
                      </motion.li>
                    ))}
                  </ul>

                  {/* Кнопка підписки */}
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      className={`w-full py-3 text-lg font-semibold transition-all duration-300 ${
                        plan.id === 'plus'
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg'
                          : plan.id === 'pro'
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg'
                          : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg'
                      } ${currentSubscription?.plan === plan.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={subscribeMutation.isPending || currentSubscription?.plan === plan.id}
                    >
                      {subscribeMutation.isPending ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                          />
                          Обробка...
                        </>
                      ) : currentSubscription?.plan === plan.id ? (
                        <>
                          <CheckCircle className="w-5 h-5 mr-2" />
                          {t('plans.current', 'Поточний план')}
                        </>
                      ) : (
                        <>
                          {t('plans.select', 'Обрати {{plan}}', { plan: plan.name })}
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Features Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mb-16"
        >
          <Card className="bg-white/70 backdrop-blur-sm shadow-xl border-0">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-3xl font-bold text-gray-800">
                Порівняння можливостей
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="font-semibold text-gray-700"></div>
                <div className="font-semibold text-blue-600">Лайт</div>
                <div className="font-semibold text-purple-600">Плюс</div>
                <div className="font-semibold text-yellow-600">Про</div>
                
                <div className="text-left text-gray-700 py-3 border-t">AI запити/місяць</div>
                <div className="py-3 border-t">—</div>
                <div className="py-3 border-t">5</div>
                <div className="py-3 border-t">Необмежено</div>
                
                <div className="text-left text-gray-700 py-3 border-t">AI чат</div>
                <div className="py-3 border-t">—</div>
                <div className="py-3 border-t">—</div>
                <div className="py-3 border-t text-green-600">✓</div>
                
                <div className="text-left text-gray-700 py-3 border-t">Розширена аналітика</div>
                <div className="py-3 border-t text-green-600">✓</div>
                <div className="py-3 border-t text-green-600">✓</div>
                <div className="py-3 border-t text-green-600">✓</div>
                
                <div className="text-left text-gray-700 py-3 border-t">Експорт даних</div>
                <div className="py-3 border-t text-green-600">✓</div>
                <div className="py-3 border-t text-green-600">✓</div>
                <div className="py-3 border-t text-green-600">✓</div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Guarantee & Security */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="text-center mb-12"
        >
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-200">
            <div className="flex items-center justify-center space-x-8 flex-wrap gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-gray-700 font-medium">
                  {t('guarantee', '7-денна гарантія повернення коштів')}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-gray-700 font-medium">
                  Безпечні платежі
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-full">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-gray-700 font-medium">
                  Миттєва активація
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}