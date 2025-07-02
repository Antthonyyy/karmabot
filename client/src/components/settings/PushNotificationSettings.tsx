import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Smartphone, Clock, Check, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { PushNotifications } from '@/components/PushNotifications';

interface PushSubscription {
  id: number;
  endpoint: string;
  userAgent: string | null;
  createdAt: string;
}

export function PushNotificationSettings() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState<PushSubscription[]>([]);
  const [pushEnabled, setPushEnabled] = useState(false);

  // Check push notification support
  const isPushSupported = 'serviceWorker' in navigator && 'PushManager' in window;
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (isPushSupported) {
      setPermission(Notification.permission);
      fetchSubscriptions();
    }
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const response = await apiRequest('/api/push/subscriptions', 'GET');
      const data = await response.json();
      setSubscriptions(data.subscriptions || []);
      setPushEnabled(data.subscriptions?.length > 0);
    } catch (error) {
      console.error('Error fetching push subscriptions:', error);
    }
  };



  const getPermissionBadge = () => {
    switch (permission) {
      case 'granted':
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
          <Check className="h-3 w-3 mr-1" />
          Дозволено
        </Badge>;
      case 'denied':
        return <Badge variant="destructive">
          <X className="h-3 w-3 mr-1" />
          Заборонено
        </Badge>;
      default:
        return <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />
          Очікує дозволу
        </Badge>;
    }
  };

  const getDeviceIcon = (userAgent: string | null) => {
    if (!userAgent) return <Smartphone className="h-4 w-4" />;
    
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      return <Smartphone className="h-4 w-4" />;
    }
    
    return <Bell className="h-4 w-4" />;
  };

  if (!isPushSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Web Push Уведомлення
          </CardTitle>
          <CardDescription>
            Ваш браузер не підтримує Web Push уведомлення
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Для отримання Web Push уведомлень використовуйте сучасний браузер як Chrome, Firefox, або Safari.
              Ви все ще можете отримувати уведомлення через Telegram.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Push Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Web Push Уведомлення
          </CardTitle>
          <CardDescription>
            Отримуйте уведомлення навіть коли додаток закритий
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Permission Status */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Статус дозволів</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Поточний статус дозволу на уведомлення в браузері
              </p>
            </div>
            {getPermissionBadge()}
          </div>

          {/* Push Notifications Component */}
          <PushNotifications 
            onPermissionChange={(newPermission) => {
              setPermission(newPermission);
            }}
            onSubscriptionChange={(isSubscribed) => {
              setPushEnabled(isSubscribed);
              if (isSubscribed) {
                fetchSubscriptions();
              }
            }}
          />


        </CardContent>
      </Card>

      {/* Active Subscriptions */}
      {subscriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Активні підписки ({subscriptions.length})
            </CardTitle>
            <CardDescription>
              Пристрої, які отримують ваші push уведомлення
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {subscriptions.map((subscription) => (
                <div 
                  key={subscription.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getDeviceIcon(subscription.userAgent)}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {subscription.userAgent?.includes('Mobile') ? 'Мобільний пристрій' : 
                         subscription.userAgent?.includes('Chrome') ? 'Chrome браузер' :
                         subscription.userAgent?.includes('Firefox') ? 'Firefox браузер' :
                         subscription.userAgent?.includes('Safari') ? 'Safari браузер' :
                         'Невідомий пристрій'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Додано {new Date(subscription.createdAt).toLocaleDateString('uk-UA')}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
                    Активна
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Про Web Push уведомлення</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <p>
              <strong>Web Push</strong> працює паралельно з Telegram уведомленнями та дозволяє:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Отримувати уведомлення навіть коли браузер закритий</li>
              <li>Працювати без потреби у встановленому Telegram</li>
              <li>Швидко переходити до додатку одним кліком</li>
              <li>Отримувати уведомлення на всіх ваших пристроях</li>
            </ul>
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-500">
              Примітка: Push уведомлення можуть не працювати в приватному режимі браузера.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}