import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Bell, Clock, Settings, Save, Plus, Trash2, ArrowRight, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import ReminderModeSelector from "@/components/ReminderModeSelector";
import CustomScheduleEditor from "@/components/CustomScheduleEditor";
import { BackButton } from "@/components/BackButton";
import VideoInstructionModal from "@/components/VideoInstructionModal";

interface Schedule {
  id?: number;
  time: string;
  type: 'principle' | 'reflection';
  enabled: boolean;
}

export default function SettingsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [reminderMode, setReminderMode] = useState('balanced');
  const [customSchedule, setCustomSchedule] = useState<Schedule[]>([]);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  
  // Загружаем пользователя
  const { data: user } = useQuery({
    queryKey: ["/api/user/me"],
  });
  
  // Загружаем настройки напоминаний
  const { data: reminderSettings, isLoading } = useQuery({
    queryKey: ["/api/user/reminder-settings"],
    enabled: !!user,
  });
  
  // Загружаем текущие настройки
  useEffect(() => {
    if (reminderSettings) {
      setRemindersEnabled(reminderSettings.remindersEnabled ?? true);
      setReminderMode(reminderSettings.reminderMode || 'balanced');
      
      if (reminderSettings.schedule && reminderSettings.schedule.length > 0) {
        setCustomSchedule(reminderSettings.schedule);
      }
    }
  }, [reminderSettings]);
  
  const setupRemindersMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/user/setup-reminders", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/reminder-settings"] });
      toast({
        title: "Налаштування збережено",
        description: "Розклад нагадувань оновлено успішно",
      });
      setShowModeSelector(false);
      setShowContinueButton(true);
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
    mutationFn: () => apiRequest("POST", "/api/reminders/test"),
    onSuccess: () => {
      toast({
        title: "Тестове нагадування відправлено",
        description: "Перевірте Telegram",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося відправити тестове нагадування",
        variant: "destructive",
      });
    },
  });
  
  const handleSave = async () => {
    setupRemindersMutation.mutate({
      reminderMode,
      customSchedule: reminderMode === 'custom' ? customSchedule : undefined,
    });
  };
  
  const sendTestReminder = () => {
    testReminderMutation.mutate();
  };

  const handleContinue = async () => {
    console.log('Starting onboarding completion...');
    try {
      await apiRequest("PATCH", "/api/user/onboarding/complete");
      console.log('Onboarding completion successful');
      
      // Update user cache immediately
      queryClient.setQueryData(["/api/user/me"], (oldData: any) => ({
        ...oldData,
        hasCompletedOnboarding: true
      }));
      
      // Navigate immediately
      console.log('Navigating to dashboard...');
      setLocation('/dashboard');
    } catch (error) {
      console.error('Onboarding completion failed:', error);
      // Navigate anyway to not block the user
      setLocation('/dashboard');
    }
  };
  
  // Отображение текущего режима
  const getModeDisplay = () => {
    const modes = {
      intensive: { name: 'Інтенсивний', principles: 4, color: 'bg-red-100 text-red-700', description: '4 принципи + вечірня рефлексія' },
      balanced: { name: 'Збалансований', principles: 3, color: 'bg-green-100 text-green-700', description: '3 принципи + вечірня рефлексія' },
      light: { name: 'Легкий', principles: 2, color: 'bg-blue-100 text-blue-700', description: '2 принципи + вечірня рефлексія' },
      custom: { name: 'Власний', principles: customSchedule.filter(s => s.type === 'principle' && s.enabled).length, color: 'bg-purple-100 text-purple-700', description: `${customSchedule.filter(s => s.type === 'principle' && s.enabled).length} принципи + власний розклад` },
    };
    
    return modes[reminderMode] || modes.balanced;
  };
  
  const currentMode = getModeDisplay();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto p-4">
        <BackButton />
        
        {/* Основная карточка настроек */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-6 w-6" />
              Налаштування нагадувань
            </CardTitle>
            <CardDescription>
              Керуйте розкладом отримання кармічних принципів
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Включение/выключение напоминаний */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <Label htmlFor="reminders-enabled" className="flex items-center gap-2 cursor-pointer">
                <Bell className="h-4 w-4" />
                <div>
                  <div className="font-medium">Отримувати нагадування</div>
                  <div className="text-sm text-gray-500">Щоденні нагадування про кармічні принципи</div>
                </div>
              </Label>
              <Switch
                id="reminders-enabled"
                checked={remindersEnabled}
                onCheckedChange={setRemindersEnabled}
              />
            </div>
            
            {/* Текущий режим */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-medium">Поточний режим</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowModeSelector(!showModeSelector);
                    setShowContinueButton(false);
                  }}
                  disabled={!remindersEnabled}
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Змінити
                </Button>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge className={currentMode.color}>
                  {currentMode.name}
                </Badge>
                <span className="text-sm text-gray-600">
                  {currentMode.description}
                </span>
              </div>
              
              {/* Показываем расписание для текущего режима */}
              {!showModeSelector && customSchedule.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-gray-700">Розклад нагадувань:</p>
                  <div className="space-y-1">
                    {customSchedule
                      .filter(s => s.enabled)
                      .map((schedule, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-3 w-3" />
                          <span>{schedule.time}</span>
                          <span className="text-gray-400">•</span>
                          <span>
                            {schedule.type === 'principle' ? 'Новий принцип' : 'Вечірня рефлексія'}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Селектор режимов (показывается при нажатии "Изменить") */}
            {showModeSelector && (
              <div className="space-y-6 p-4 bg-gray-50 rounded-lg">
                <ReminderModeSelector
                  selectedMode={reminderMode}
                  onModeSelect={setReminderMode}
                />
                
                {/* Кастомный редактор (если выбран custom режим) */}
                {reminderMode === 'custom' && (
                  <CustomScheduleEditor
                    schedule={customSchedule}
                    onChange={setCustomSchedule}
                  />
                )}
                
                {/* Кнопки сохранения/отмены */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowModeSelector(false);
                      setShowContinueButton(false);
                      // Восстанавливаем исходные настройки
                      if (reminderSettings) {
                        setReminderMode(reminderSettings.reminderMode || 'balanced');
                        if (reminderSettings.schedule) {
                          setCustomSchedule(reminderSettings.schedule);
                        }
                      }
                    }}
                    className="flex-1"
                  >
                    Скасувати
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={setupRemindersMutation.isPending}
                    className="flex-1"
                  >
                    {setupRemindersMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Збереження...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Зберегти зміни
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
            
            {/* Кнопка "Продовжити" после настройки */}
            {showContinueButton && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-green-800">Налаштування збережено!</p>
                    <p className="text-sm text-green-600">Тепер ви готові до практики кармічних принципів</p>
                  </div>
                  <Button
                    onClick={handleContinue}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Продовжити
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            
            {/* Информация о часовом поясе */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Часовий пояс:</strong> Київський час (UTC+2)
              </p>
              <p className="text-sm text-blue-600 mt-1">
                Нагадування будуть приходити за київським часом
              </p>
            </div>
            
            {/* Кнопка видеоинструкции */}
            <Button
              variant="outline"
              onClick={() => setShowVideoModal(true)}
              className="w-full"
            >
              <Play className="mr-2 h-4 w-4" />
              Переглянути відеоінструкцію
            </Button>

            {/* Кнопка тестового напоминания */}
            <Button
              variant="outline"
              onClick={sendTestReminder}
              disabled={!remindersEnabled || testReminderMutation.isPending}
              className="w-full"
            >
              {testReminderMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2" />
                  Відправляємо...
                </>
              ) : (
                <>
                  <Bell className="mr-2 h-4 w-4" />
                  Надіслати тестове нагадування
                </>
              )}
            </Button>
          </CardContent>
        </Card>
        
        {/* Информационная карточка */}
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              <strong>Важливо:</strong> Для отримання нагадувань переконайтеся, що ви запустили бота @karmics_diary_bot в Telegram та не заблокували його.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Video instruction modal */}
      <VideoInstructionModal
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
        title="📖 Інструкція користування додатком"
        description="Дізнайтеся, як максимально ефективно використовувати ваш карма-щоденник для духовного розвитку"
        videoId="dQw4w9WgXcQ"
      />
    </div>
  );
}