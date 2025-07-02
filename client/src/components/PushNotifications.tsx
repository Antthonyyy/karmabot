import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Bell, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface PushNotificationsProps {
  onPermissionChange?: (permission: NotificationPermission) => void;
  onSubscriptionChange?: (isSubscribed: boolean) => void;
}

export function PushNotifications({ onPermissionChange, onSubscriptionChange }: PushNotificationsProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Check push support
  const isPushSupported = 'serviceWorker' in navigator && 'PushManager' in window;

  useEffect(() => {
    if (isPushSupported) {
      checkPushStatus();
    }
  }, []);

  const checkPushStatus = async () => {
    try {
      setPermission(Notification.permission);
      onPermissionChange?.(Notification.permission);

      const reg = await navigator.serviceWorker.ready;
      setRegistration(reg);

      const subscription = await reg.pushManager.getSubscription();
      const isCurrentlySubscribed = !!subscription;
      setIsSubscribed(isCurrentlySubscribed);
      onSubscriptionChange?.(isCurrentlySubscribed);
    } catch (error) {
      console.error('Error checking push status:', error);
    }
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      onPermissionChange?.(permission);
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeToPush = async () => {
    if (!registration || permission !== 'granted') {
      if (permission !== 'granted') {
        const granted = await requestNotificationPermission();
        if (!granted) return;
      }
      if (!registration) {
        toast({
          variant: "destructive",
          title: t('error', 'Помилка'),
          description: t('serviceWorkerError', 'Service Worker недоступний')
        });
        return;
      }
    }

    setIsLoading(true);
    try {
      // VAPID ключі для push уведомлень
      const applicationServerKey = urlBase64ToUint8Array(
        'BEl62iUYgUivxIkv69yViEuiBIa40HI80YatOtMnQ3A-dSMF2s_ZOw8Z8gUQ8P7Lv8F7c9I-V4zCYhKRzP1XA7Q'
      );

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });

      // Відправляємо підписку на сервер
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(subscription)
      });

      if (response.ok) {
        setIsSubscribed(true);
        onSubscriptionChange?.(true);
        toast({
          title: t('subscribed', 'Підписано'),
          description: t('pushSubscribedDesc', 'Ви успішно підписані на push уведомлення')
        });
      } else {
        throw new Error('Failed to save subscription');
      }
    } catch (error) {
      console.error('Error subscribing to push:', error);
      toast({
        variant: "destructive",
        title: t('error', 'Помилка'),
        description: t('subscriptionError', 'Помилка при підписці на уведомлення')
      });
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribeFromPush = async () => {
    if (!registration) return;

    setIsLoading(true);
    try {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        
        // Видаляємо підписку з сервера
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        });
      }

      setIsSubscribed(false);
      onSubscriptionChange?.(false);
      toast({
        title: t('unsubscribed', 'Відписано'),
        description: t('pushUnsubscribedDesc', 'Ви відписалися від push уведомлень')
      });
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      toast({
        variant: "destructive",
        title: t('error', 'Помилка'),
        description: t('unsubscriptionError', 'Помилка при відписці від уведомлень')
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPermissionStatus = () => {
    switch (permission) {
      case 'granted':
        return {
          icon: <CheckCircle className="h-4 w-4 text-green-500" />,
          text: t('granted', 'Дозволено'),
          variant: 'default' as const
        };
      case 'denied':
        return {
          icon: <XCircle className="h-4 w-4 text-red-500" />,
          text: t('denied', 'Заборонено'),
          variant: 'destructive' as const
        };
      default:
        return {
          icon: <AlertCircle className="h-4 w-4 text-orange-500" />,
          text: t('notRequested', 'Не запитано'),
          variant: 'secondary' as const
        };
    }
  };

  if (!isPushSupported) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
          <XCircle className="h-5 w-5" />
          <div>
            <p className="font-medium">{t('pushNotSupported', 'Push уведомлення не підтримуються')}</p>
            <p className="text-sm">{t('pushNotSupportedDesc', 'Ваш браузер не підтримує push уведомлення')}</p>
          </div>
        </div>
      </div>
    );
  }

  const permissionStatus = getPermissionStatus();

  return (
    <div className="space-y-4">
      {/* Status Header */}
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-purple-600" />
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">
              {t('pushNotifications', 'Push Уведомлення')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('pushDesc', 'Отримуйте уведомлення навіть коли додаток закритий')}
            </p>
          </div>
        </div>
        <Badge variant={permissionStatus.variant} className="flex items-center gap-1">
          {permissionStatus.icon}
          {permissionStatus.text}
        </Badge>
      </div>

      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div>
          <p className="font-medium text-gray-900 dark:text-white">
            {t('enablePush', 'Увімкнути Push уведомлення')}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isSubscribed ? t('pushActive', 'Активні') : t('pushInactive', 'Неактивні')}
          </p>
        </div>
        <Switch
          checked={isSubscribed}
          onCheckedChange={(checked) => {
            if (checked) {
              subscribeToPush();
            } else {
              unsubscribeFromPush();
            }
          }}
          disabled={isLoading || permission === 'denied'}
        />
      </div>

      {permission === 'denied' && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
            <XCircle className="h-4 w-4" />
            <p className="text-sm font-medium">
              {t('permissionDenied', 'Дозвіл заборонено')}
            </p>
          </div>
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">
            {t('permissionDeniedDesc', 'Щоб увімкнути уведомлення, дозвольте їх у налаштуваннях браузера')}
          </p>
        </div>
      )}

      {permission === 'default' && (
        <div className="flex justify-center">
          <Button 
            onClick={requestNotificationPermission}
            disabled={isLoading}
            className="w-full"
          >
            {t('requestPermission', 'Дозволити уведомлення')}
          </Button>
        </div>
      )}
    </div>
  );
}