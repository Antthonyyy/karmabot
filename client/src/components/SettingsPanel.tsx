import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';
import { User } from "@/lib/types";
import { 
  MessageSquare, 
  Bell, 
  User as UserIcon, 
  Shield, 
  CheckCircle,
  Download,
  Trash,
  UserX,
  Unlink
} from "lucide-react";

interface SettingsPanelProps {
  user: User;
}

export default function SettingsPanel({ user }: SettingsPanelProps) {
  const [settings, setSettings] = useState({
    notificationType: user.notificationType || "daily",
    morningTime: "09:00",
    eveningTime: "20:00",
    weekends: true,
    language: user.language || "uk",
    timezoneOffset: user.timezoneOffset || 0,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("/api/user/settings", {
        method: "PATCH",
        body: JSON.stringify(data)
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Налаштування збережено!",
        description: "Ваші налаштування успішно оновлено.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/me"] });
    },
    onError: (error) => {
      console.error("Error updating settings:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося зберегти налаштування. Спробуйте ще раз.",
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate({
      notificationType: settings.notificationType,
      customTimes: {
        morning: settings.morningTime,
        evening: settings.eveningTime,
        weekends: settings.weekends,
      },
      language: settings.language,
      timezoneOffset: settings.timezoneOffset,
    });
  };

  const handleExportData = () => {
    toast({
      title: "Експорт даних",
      description: "Функція експорту буде доступна найближчим часом.",
    });
  };

  const handleClearData = () => {
    toast({
      title: "Очистка даних",
      description: "Ця дія незворотна. Функція буде доступна найближчим часом.",
      variant: "destructive",
    });
  };

  const handleDeleteAccount = () => {
    toast({
      title: "Видалення акаунту",
      description: "Ця дія незворотна. Функція буде доступна найближчим часом.",
      variant: "destructive",
    });
  };

  return (
    <div className="space-y-8">
      {/* Telegram Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
            Інтеграція з Telegram
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-900">Статус підключення</span>
                <Badge variant={user.telegramConnected ? "default" : "secondary"}>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {user.telegramConnected ? "Підключено" : "Не підключено"}
                </Badge>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                {user.telegramConnected 
                  ? "Ваш акаунт успішно пов'язаний з @KarmaBot" 
                  : "Підключіть Telegram для отримання нагадувань"
                }
              </p>
              {user.telegramId && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">Telegram ID:</p>
                  <code className="text-blue-600 font-mono text-sm">{user.telegramId}</code>
                </div>
              )}
            </div>
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium text-gray-900 mb-3">Можливості бота</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center space-x-2">
                    <Bell className="w-4 h-4 text-green-500" />
                    <span>Персоналізовані нагадування</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4 text-green-500" />
                    <span>Записи в щоденник через повідомлення</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <UserIcon className="w-4 h-4 text-green-500" />
                    <span>Швидкий доступ до статистики</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
          
          {user.telegramConnected && (
            <div className="flex justify-end">
              <Button variant="outline" className="text-red-600 hover:text-red-700">
                <Unlink className="w-4 h-4 mr-2" />
                Відключити Telegram
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="w-5 h-5 mr-2 text-blue-600" />
            Налаштування сповіщень
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-base font-medium mb-3 block">Частота нагадувань</Label>
            <Select 
              value={settings.notificationType} 
              onValueChange={(value) => setSettings({ ...settings, notificationType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Щодня</SelectItem>
                <SelectItem value="every_2">Кожні 2 години</SelectItem>
                <SelectItem value="every_2.5">Кожні 2.5 години</SelectItem>
                <SelectItem value="every_3">Кожні 3 години</SelectItem>
                <SelectItem value="every_4">Кожні 4 години</SelectItem>
                <SelectItem value="custom">Власний час</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="morningTime" className="text-sm text-gray-600 mb-2 block">
                Ранкове нагадування
              </Label>
              <Input
                id="morningTime"
                type="time"
                value={settings.morningTime}
                onChange={(e) => setSettings({ ...settings, morningTime: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="eveningTime" className="text-sm text-gray-600 mb-2 block">
                Вечірнє нагадування
              </Label>
              <Input
                id="eveningTime"
                type="time"
                value={settings.eveningTime}
                onChange={(e) => setSettings({ ...settings, eveningTime: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Вихідні дні</p>
              <p className="text-sm text-gray-600">Отримувати нагадування в суботу та неділю</p>
            </div>
            <Switch
              checked={settings.weekends}
              onCheckedChange={(checked) => setSettings({ ...settings, weekends: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserIcon className="w-5 h-5 mr-2 text-blue-600" />
            Профіль
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="firstName" className="text-base font-medium mb-2 block">
                Ім'я
              </Label>
              <Input
                id="firstName"
                value={user.firstName}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                Ім'я синхронізується з Telegram
              </p>
            </div>
            <div>
              <Label htmlFor="language" className="text-base font-medium mb-2 block">
                Мова інтерфейсу
              </Label>
              <Select 
                value={settings.language} 
                onValueChange={(value) => setSettings({ ...settings, language: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="uk">Українська</SelectItem>
                  <SelectItem value="ru">Русский</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2 text-blue-600" />
            Дані та конфіденційність
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-900">Експорт даних</p>
              <p className="text-sm text-gray-600">Завантажити всі ваші записи та статистику</p>
            </div>
            <Button variant="outline" onClick={handleExportData}>
              <Download className="w-4 h-4 mr-2" />
              Експорт
            </Button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-900">Очистити дані</p>
              <p className="text-sm text-gray-600">Видалити всі записи щоденника</p>
            </div>
            <Button variant="outline" className="text-red-600 hover:text-red-700" onClick={handleClearData}>
              <Trash className="w-4 h-4 mr-2" />
              Очистити
            </Button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-900">Видалити акаунт</p>
              <p className="text-sm text-gray-600">Остаточно видалити ваш профіль та всі дані</p>
            </div>
            <Button variant="outline" className="text-red-600 hover:text-red-700" onClick={handleDeleteAccount}>
              <UserX className="w-4 h-4 mr-2" />
              Видалити
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Settings */}
      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={() => {
          setSettings({
            notificationType: user.notificationType || "daily",
            morningTime: "09:00",
            eveningTime: "20:00",
            weekends: true,
            language: user.language || "uk",
            timezoneOffset: user.timezoneOffset || 0,
          });
        }}>
          Скасувати зміни
        </Button>
        <Button 
          onClick={handleSaveSettings}
          disabled={updateSettingsMutation.isPending}
          className="px-8"
        >
          {updateSettingsMutation.isPending ? "Збереження..." : "Зберегти налаштування"}
        </Button>
      </div>
    </div>
  );
}
