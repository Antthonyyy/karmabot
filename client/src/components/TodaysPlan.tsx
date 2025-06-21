import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Clock, Target, Plus, Settings } from "lucide-react";
import { Link } from "wouter";

interface TodaysPlanProps {
  className?: string;
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

export default function TodaysPlan({ className }: TodaysPlanProps) {
  const { data: todaysPlan, isLoading } = useQuery<TodaysPlanData>({
    queryKey: ["/api/dashboard/today-plan"],
    refetchInterval: 30000, // Обновляем каждые 30 секунд
  });

  if (isLoading) {
    return (
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
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!todaysPlan || todaysPlan.principles.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            План на сьогодні
          </CardTitle>
          <CardDescription>
            Налаштуйте нагадування, щоб побачити свій план
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🎯</div>
            <p className="text-muted-foreground mb-4">
              Щоб бачити свій щоденний план, потрібно налаштувати нагадування
            </p>
            <Link href="/settings">
              <Button className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Налаштувати нагадування
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { principles, progress } = todaysPlan;

  const currentTime = new Date().toLocaleTimeString('uk-UA', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
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
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress.percentage} className="w-full" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Прогрес: {progress.percentage}%</span>
            <span>{progress.completed}/{progress.total} завершено</span>
          </div>
        </div>

        {/* Principles List */}
        <div className="space-y-3">
          {principles.map((principle, index) => {
            const isUpcoming = !principle.completed && index === 0;
            return (
              <div
                key={principle.id}
                className={`flex items-center gap-3 p-4 rounded-lg border transition-all duration-200 ${
                  principle.completed
                    ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                    : isUpcoming
                    ? 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800 shadow-md'
                    : 'bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-700'
                }`}
              >
                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {principle.completed ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                  ) : isUpcoming ? (
                    <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center">
                      <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
                    </div>
                  ) : (
                    <Circle className="h-6 w-6 text-gray-400" />
                  )}
                </div>

                {/* Principle Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge 
                      variant={principle.completed ? "default" : isUpcoming ? "secondary" : "outline"} 
                      className="text-xs"
                    >
                      Принцип {principle.number}
                    </Badge>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {principle.scheduledTime}
                    </span>
                    {isUpcoming && (
                      <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        Наступний
                      </Badge>
                    )}
                  </div>
                  <h4 className={`font-medium text-sm leading-tight mb-1 ${
                    isUpcoming ? 'text-blue-900 dark:text-blue-100' : ''
                  }`}>
                    {principle.title}
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
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Записати
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Motivational Messages */}
        {progress.completed === progress.total && progress.total > 0 && (
          <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg border border-green-200 dark:border-green-800">
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
          <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg border border-blue-200 dark:border-blue-800">
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
          <div className="text-center p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="text-2xl mb-2">⚡</div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-1">
              Чудовий темп! Продовжуйте в тому ж дусі
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Залишилось {progress.total - progress.completed} принципів до завершення
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}