import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Clock, Bell, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function SettingsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [morningTime, setMorningTime] = useState("09:00");
  const [eveningTime, setEveningTime] = useState("21:00");
  
  const { data: user } = useQuery({
    queryKey: ['/api/user/me'],
    enabled: true,
  });

  useEffect(() => {
    if (user) {
      setRemindersEnabled(user.remindersEnabled ?? true);
      setMorningTime(user.morningReminderTime || "09:00");
      setEveningTime(user.eveningReminderTime || "21:00");
    }
  }, [user]);

  const updateSettingsMutation = useMutation({
    mutationFn: (settings: any) => apiRequest("PUT", "/api/user/settings", settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/me'] });
      toast({
        title: "Налаштування збережено",
        description: "Час нагадувань оновлено успішно",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося зберегти налаштування",
        variant: "destructive",
      });
    },
  });

  const testReminderMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/reminders/test", {}),
    onSuccess: () => {
      toast({
        title: "Тестове нагадування надіслано",
        description: "Перевірте ваш Telegram",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося надіслати тестове нагадування",
        variant: "destructive",
      });
    },
  });
  
  const handleSave = () => {
    updateSettingsMutation.mutate({
      remindersEnabled,
      morningReminderTime: morningTime,
      eveningReminderTime: eveningTime,
      timezone: 'Europe/Kiev',
    });
  };

  const handleTestReminder = () => {
    testReminderMutation.mutate();
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-2xl mx-auto p-4">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-6 w-6" />
              Налаштування нагадувань
            </CardTitle>
            <CardDescription>
              Налаштуйте час отримання нагадувань про кармічні принципи
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Включення/виключення нагадувань */}
            <div className="flex items-center justify-between">
              <Label htmlFor="reminders-enabled" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Отримувати нагадування
              </Label>
              <Switch
                id="reminders-enabled"
                checked={remindersEnabled}
                onCheckedChange={setRemindersEnabled}
              />
            </div>
            
            {/* Час ранкового нагадування */}
            <div className="space-y-2">
              <Label htmlFor="morning-time" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Ранкове нагадування
              </Label>
              <Input
                id="morning-time"
                type="time"
                value={morningTime}
                onChange={(e) => setMorningTime(e.target.value)}
                disabled={!remindersEnabled}
                className="max-w-xs"
              />
              <p className="text-sm text-muted-foreground">
                Отримайте принцип для роздумів на початку дня
              </p>
            </div>
            
            {/* Час вечірнього нагадування */}
            <div className="space-y-2">
              <Label htmlFor="evening-time" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Вечірнє нагадування
              </Label>
              <Input
                id="evening-time"
                type="time"
                value={eveningTime}
                onChange={(e) => setEveningTime(e.target.value)}
                disabled={!remindersEnabled}
                className="max-w-xs"
              />
              <p className="text-sm text-muted-foreground">
                Підведіть підсумки дня та оцініть виконання принципу
              </p>
            </div>
            
            {/* Інформація про часовий пояс */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Часовий пояс:</strong> Київський час (UTC+2)
              </p>
              <p className="text-sm text-blue-600 mt-1">
                Нагадування будуть приходити за київським часом
              </p>
            </div>
            
            {/* Кнопка збереження */}
            <Button
              onClick={handleSave}
              disabled={updateSettingsMutation.isPending}
              className="w-full"
            >
              {updateSettingsMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Збереження...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Зберегти налаштування
                </>
              )}
            </Button>

            {/* Кнопка тестового нагадування */}
            <Button
              variant="outline"
              onClick={handleTestReminder}
              disabled={testReminderMutation.isPending || !user?.telegramConnected}
              className="w-full"
            >
              {testReminderMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2" />
                  Відправка...
                </>
              ) : (
                <>
                  <Bell className="mr-2 h-4 w-4" />
                  Надіслати тестове нагадування
                </>
              )}
            </Button>
            
            {!user?.telegramConnected && (
              <p className="text-sm text-red-600 text-center">
                Підключіть Telegram для тестування нагадувань
              </p>
            )}
          </CardContent>
        </Card>
        
        {/* Попередження */}
        <Card className="mt-4">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              <strong>Важливо:</strong> Для отримання нагадувань переконайтеся, що ви запустили бота @karmics_diary_bot в Telegram та не заблокували його.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}