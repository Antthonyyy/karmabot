import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Bell, BellOff, CheckCircle, XCircle } from 'lucide-react';
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

  useEffect(() => {
    checkNotificationSupport();
    getServiceWorkerRegistration();
  }, []);

  const checkNotificationSupport = () => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      onPermissionChange?.(Notification.permission);
    }
  };

  const getServiceWorkerRegistration = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        setRegistration(reg);
        checkExistingSubscription(reg);
      } catch (error) {
        console.error('Service Worker not available:', error);
      }
    }
  };

  const checkExistingSubscription = async (reg: ServiceWorkerRegistration) => {
    try {
      const subscription = await reg.pushManager.getSubscription();
      const subscribed = subscription !== null;
      setIsSubscribed(subscribed);
      onSubscriptionChange?.(subscribed);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast({
        variant: "destructive",
        title: t('notSupported', 'Не підтримується'),
        description: t('pushNotSupportedDesc', 'Ваш браузер не підтримує push уведомлення')
      });
      return false;
    }

    setIsLoading(true);
    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      onPermissionChange?.(permission);

      if (permission === 'granted') {
        toast({
          title: t('permissionGranted', 'Дозвіл надано'),
          description: t('pushPermissionGrantedDesc', 'Тепер ви будете отримувати push уведомлення')
        });
        return true;
      } else {
        toast({
          variant: "destructive",
          title: t('permissionDenied', 'Дозвіл відхилено'),
          description: t('pushPermissionDeniedDesc', 'Увімкніть уведомлення в налаштуваннях браузера')
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      toast({
        variant: "destructive",
        title: t('error', 'Помилка'),
        description: t('permissionError', 'Помилка при запиті дозволу на уведомлення')
      });
      return false;
    } finally {
      setIsLoading(false);
    }
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

  const sendTestNotification = async () => {
    if (!isSubscribed) {
      toast({
        variant: "destructive",
        title: t('notSubscribed', 'Не підписано'),
        description: t('subscribeFirstDesc', 'Спочатку підпишіться на уведомлення')
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/push/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast({
          title: t('testSent', 'Тест надіслано'),
          description: t('testNotificationDesc', 'Тестове уведомлення надіслано')
        });
      } else {
        throw new Error('Failed to send test notification');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast({
        variant: "destructive",
        title: t('error', 'Помилка'),
        description: t('testError', 'Помилка при надсиланні тестового уведомлення')
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
          icon: <Bell className="h-4 w-4 text-gray-500" />,
          text: t('notRequested', 'Не запитано'),
          variant: 'secondary' as const
        };
    }
  };

  const permissionStatus = getPermissionStatus();

  if (!('Notification' in window)) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <div className="flex items-center gap-2">
          <BellOff className="h-5 w-5 text-yellow-600" />
          <span className="text-sm text-yellow-800 dark:text-yellow-200">
            {t('pushNotSupported', 'Push уведомлення не підтримуються цим браузером')}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
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
          disabled={isLoading}
        />
      </div>

      {permission !== 'granted' && !isSubscribed && (
        <Button
          onClick={requestNotificationPermission}
          disabled={isLoading}
          className="w-full"
          variant="outline"
        >
          <Bell className="h-4 w-4 mr-2" />
          {t('requestPermission', 'Запитати дозвіл')}
        </Button>
      )}

      {isSubscribed && (
        <Button
          onClick={sendTestNotification}
          disabled={isLoading}
          variant="outline"
          className="w-full"
        >
          {t('sendTest', 'Надіслати тест')}
        </Button>
      )}
    </div>
  );
}

// Конвертація VAPID ключа
function urlBase64ToUint8Array(base64String: string) {
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
}