import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function ProgressChart() {
  const { data: user } = useQuery({ queryKey: ['/api/user/me'] });
  const stats = user?.stats;

  const progressPercentage = Math.min(((stats?.totalEntries || 0) / (stats?.weeklyGoal || 7)) * 100, 100);

  return (
    <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-white/20 dark:border-slate-700/50 shadow-xl">
      <div className="h-1 bg-gradient-to-r from-green-500 via-teal-500 to-blue-500"></div>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-teal-600 text-white">
              <TrendingUp className="w-4 h-4" />
            </div>
            Прогрес тижня
          </CardTitle>
          <div className="text-right">
            <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
              {Math.round(progressPercentage)}%
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-500 to-teal-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Записи: {stats?.totalEntries || 0}</span>
            <span className="text-muted-foreground">Ціль: {stats?.weeklyGoal || 7}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <Activity className="w-4 h-4" />
            <span>Тримайте темп!</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}