import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft } from "lucide-react";
import ReminderModeSelector from "@/components/ReminderModeSelector";
import CustomScheduleEditor, { type ScheduleItem } from "@/components/CustomScheduleEditor";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [reminderMode, setReminderMode] = useState('balanced');
  const [customSchedule, setCustomSchedule] = useState<ScheduleItem[]>([]);

  const { toast } = useToast();

  const setupRemindersMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/user/setup-reminders", data),
    onSuccess: () => {
      toast({
        title: "Налаштування збережено",
        description: "Ваша система нагадувань налаштована успішно!",
      });
      // Redirect to dashboard or next step
      window.location.href = '/dashboard';
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося зберегти налаштування",
        variant: "destructive",
      });
    },
  });

  const handleFinishSetup = () => {
    setupRemindersMutation.mutate({
      reminderMode,
      customSchedule: reminderMode === 'custom' ? customSchedule : undefined,
    });
  };

  const canProceedToCustom = reminderMode === 'custom';
  const canFinishCustom = reminderMode === 'custom' && 
    customSchedule.filter(s => s.type === 'principle' && s.enabled).length >= 2;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-3xl font-bold text-gray-900">
              Налаштування нагадувань
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Крок {step} з {reminderMode === 'custom' ? '2' : '1'}
            </p>
          </CardHeader>
          
          <CardContent className="px-8 pb-8">
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-xl font-semibold mb-2">Оберіть режим нагадувань</h2>
                  <p className="text-gray-600">
                    Виберіть режим, який найкраще відповідає вашому стилю життя
                  </p>
                </div>
                
                <ReminderModeSelector
                  selectedMode={reminderMode}
                  onModeSelect={setReminderMode}
                />
                
                <div className="flex justify-between pt-6">
                  <div></div>
                  <Button
                    onClick={() => {
                      if (canProceedToCustom) {
                        setStep(2);
                      } else {
                        handleFinishSetup();
                      }
                    }}
                    className="px-8"
                    disabled={setupRemindersMutation.isPending}
                  >
                    {setupRemindersMutation.isPending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    ) : null}
                    {canProceedToCustom ? 'Далі' : 'Завершити налаштування'}
                    {canProceedToCustom && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && reminderMode === 'custom' && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-xl font-semibold mb-2">Налаштуйте власний розклад</h2>
                  <p className="text-gray-600">
                    Створіть персональний розклад нагадувань
                  </p>
                </div>
                
                <CustomScheduleEditor
                  schedule={customSchedule}
                  onChange={setCustomSchedule}
                />
                
                <div className="flex justify-between pt-6">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Назад
                  </Button>
                  <Button
                    onClick={handleFinishSetup}
                    disabled={!canFinishCustom || setupRemindersMutation.isPending}
                    className="px-8"
                  >
                    {setupRemindersMutation.isPending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    ) : null}
                    Завершити налаштування
                  </Button>
                </div>
                
                {!canFinishCustom && (
                  <div className="bg-yellow-50 p-3 rounded-lg text-sm text-yellow-800 text-center">
                    Додайте принаймні 2 нагадування для принципів
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}