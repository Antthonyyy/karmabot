import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Clock, Target } from "lucide-react";

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
      </Card>
    );
  }

  const { principles, progress } = todaysPlan;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          План на сьогодні
        </CardTitle>
        <CardDescription>
          Виконано: {progress.completed} з {progress.total}
        </CardDescription>
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
          {principles.map((principle) => (
            <div
              key={principle.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                principle.completed
                  ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                  : 'bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-700'
              }`}
            >
              {/* Status Icon */}
              <div className="flex-shrink-0">
                {principle.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-400" />
                )}
              </div>

              {/* Principle Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">
                    Принцип {principle.number}
                  </Badge>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {principle.scheduledTime}
                  </span>
                </div>
                <h4 className="font-medium text-sm leading-tight">
                  {principle.title}
                </h4>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {principle.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Motivational Message */}
        {progress.completed === progress.total && progress.total > 0 && (
          <div className="text-center p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              🎉 Чудово! Сьогоднішній план виконано повністю!
            </p>
          </div>
        )}

        {progress.completed === 0 && (
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💪 Почніть день з першого принципу!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}