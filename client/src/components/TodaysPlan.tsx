import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CheckCircle2, Circle, Clock, Target, Plus, Settings } from "lucide-react";
import { Link } from "wouter";
import DiaryForm from "./DiaryForm";
import AIDailyInsight from "./AIDailyInsight";


interface TodaysPlanProps {
  className?: string;
  currentPrincipleId?: number;
}

interface PrincipleItem {
  id: number;
  number: number;
  title: string;
  description: string;
  completed: boolean;
  scheduledTime: string;
}

interface TodaysPlanData {
  principles: PrincipleItem[];
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
  date: string;
}

export default function TodaysPlan({ className, currentPrincipleId = 1 }: TodaysPlanProps) {
  const [showDiaryForm, setShowDiaryForm] = useState(false);
  const [selectedPrinciple, setSelectedPrinciple] = useState<any>(null);
  
  const { data: todaysPlan, isLoading } = useQuery<TodaysPlanData>({
    queryKey: ["/api/dashboard/today-plan"],
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div>
        <Card className={className}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              План на сьогодні
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-2 bg-gray-200 rounded"></div>
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!todaysPlan || todaysPlan.principles.length === 0) {
    return (
      <div>
        <Card className={className}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              План на сьогодні
            </CardTitle>
            <CardDescription>
              Розпочніть свій шлях до кращої карми
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🌟</div>
              <p className="text-muted-foreground mb-4">
                Сьогодні ви можете почати працювати з першим принципом карми.
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Створіть запис у щоденнику, відзначте свої добрі справи і почніть формувати позитивну карму!
              </p>
              <div className="flex flex-col gap-2">
                <Link href="/journal">
                  <Button className="flex items-center gap-2 w-full">
                    <Plus className="h-4 w-4" />
                    Створити запис у щоденнику
                  </Button>
                </Link>
                <Link href="/settings">
                  <Button variant="outline" className="flex items-center gap-2 w-full">
                    <Settings className="h-4 w-4" />
                    Налаштувати нагадування
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { principles, progress } = todaysPlan;

  const currentTime = new Date().toLocaleTimeString('uk-UA', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div>
      <Card className={className}>
        <CardHeader className="pb-3 sm:pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
            <div>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Target className="h-4 w-4 sm:h-5 sm:w-5" />
                План на сьогодні
              </CardTitle>
              <CardDescription>
                Виконано: {progress.completed} з {progress.total} • Зараз: {currentTime}
              </CardDescription>
            </div>
            <Badge variant={progress.completed === progress.total ? "default" : "secondary"}>
              {progress.percentage}%
            </Badge>
          </div>
          
          <div className="mt-4">
            <Progress value={progress.percentage} className="h-2" />
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {principles.map((principle) => {
              const currentTimeMinutes = new Date().getHours() * 60 + new Date().getMinutes();
              const scheduledTimeMinutes = principle.scheduledTime.split(':').reduce((acc, time) => (60 * acc) + +time, 0);
              const isUpcoming = scheduledTimeMinutes > currentTimeMinutes && !principle.completed;
              const isOverdue = scheduledTimeMinutes < currentTimeMinutes && !principle.completed;

              return (
                <div
                  key={principle.id}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                    principle.completed
                      ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                      : isUpcoming
                      ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 shadow-sm'
                      : isOverdue
                      ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
                      : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {/* Status Icon */}
                    <div className="flex-shrink-0">
                      {principle.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-400" />
                      )}
                    </div>

                    {/* Time Badge */}
                    <Badge 
                      variant={principle.completed ? "secondary" : isUpcoming ? "default" : "outline"}
                      className="flex items-center gap-1 text-xs"
                    >
                      <Clock className="h-3 w-3" />
                      {principle.scheduledTime}
                    </Badge>

                    {/* Principle Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-medium text-sm leading-tight ${
                        principle.completed 
                          ? 'text-green-700 dark:text-green-300 line-through' 
                          : isUpcoming 
                          ? 'text-blue-900 dark:text-blue-100' 
                          : ''
                      }`}>
                        Принцип {principle.number}: {principle.title}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {principle.description}
                      </p>
                    </div>

                    {/* Action Button */}
                    {!principle.completed && (
                      <div className="flex-shrink-0">
                        <Button 
                          size="sm" 
                          variant={isUpcoming ? "default" : "outline"}
                          className="h-8 px-3"
                          onClick={() => {
                            setSelectedPrinciple(principle);
                            setShowDiaryForm(true);
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Записати
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Motivational Messages */}
          {progress.completed === progress.total && progress.total > 0 && (
            <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg border border-green-200 dark:border-green-800 mt-4">
              <div className="text-2xl mb-2">🎉</div>
              <p className="text-sm font-semibold text-green-800 dark:text-green-200 mb-1">
                Вітаємо! Сьогоднішній план виконано повністю!
              </p>
              <p className="text-xs text-green-700 dark:text-green-300">
                Ваша духовна практика набирає силу
              </p>
            </div>
          )}

          {progress.completed === 0 && progress.total > 0 && (
            <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg border border-blue-200 dark:border-blue-800 mt-4">
              <div className="text-2xl mb-2">🌅</div>
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">
                Новий день, нові можливості!
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Почніть з першого принципу та зробіть цей день особливим
              </p>
            </div>
          )}

          {progress.completed > 0 && progress.completed < progress.total && (
            <div className="text-center p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 rounded-lg border border-amber-200 dark:border-amber-800 mt-4">
              <div className="text-2xl mb-2">⚡</div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-1">
                Чудовий темп! Продовжуйте в тому ж дусі
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Залишилось {progress.total - progress.completed} принципів до завершення
              </p>
            </div>
          )}

          {/* Додамо невеликий розділювач перед AI підказкою */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground font-medium">
                💫 Карма — це не покарання, а можливість...
              </p>
            </div>
            <AIDailyInsight principleId={currentPrincipleId} />
          </div>
        </CardContent>
      </Card>



      {/* Diary Form Dialog */}
      <Dialog open={showDiaryForm} onOpenChange={setShowDiaryForm}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Запис у щоденник
              {selectedPrinciple && (
                <span className="block text-sm font-normal text-gray-600 mt-1">
                  Принцип {selectedPrinciple.number}: {selectedPrinciple.title}
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              Запишіть свої думки, відчуття та досвід щодо цього принципу
            </DialogDescription>
          </DialogHeader>
          <DiaryForm 
            currentPrinciple={selectedPrinciple}
            onSuccess={() => {
              setShowDiaryForm(false);
              setSelectedPrinciple(null);
              window.location.reload();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}