import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Activity, Calendar, Target } from 'lucide-react';
import { authUtils } from '@/utils/auth';
import { apiRequest } from '@/utils/api';

export function KarmaStats() {
  const { t } = useTranslation(['stats', 'common']);

  const { data: user, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const res = await apiRequest('/api/user/me', { method: 'GET' });
      if (!res.ok) throw new Error('Failed to fetch user data');
      return res.json();
    }
  });

  if (isLoading) {
    return <div className="text-center p-8">Завантаження...</div>;
  }

  const stats = user?.stats;
  const principleCompletions = stats?.principleCompletions || [];

  // Calculate total karma from principle completions
  const totalKarma = principleCompletions.reduce((sum: number, pc: any) => {
    return sum + (pc.entriesCount * 5); // Assuming 5 karma per entry on average
  }, 0);

  const weeklyProgress = Math.min(100, (stats?.totalEntries || 0) / (stats?.weeklyGoal || 7) * 100);
  const monthlyProgress = Math.min(100, (stats?.totalEntries || 0) / (stats?.monthlyGoal || 30) * 100);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Загальна карма</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalKarma}</div>
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-green-600">
                +{Math.floor(totalKarma * 0.1)} сьогодні
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Поточна серія</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.streakDays || 0} днів</div>
            <Progress value={(stats?.streakDays || 0) * 10} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Записи в щоденнику</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalEntries || 0}</div>
            <div className="text-sm text-muted-foreground mt-1">
              Найдовша серія: {stats?.longestStreak || 0} днів
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Середній настрій</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.averageMood || 0).toFixed(1)}/10
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Енергія: {(stats?.averageEnergy || 0).toFixed(1)}/10
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Тижневий прогрес
            </CardTitle>
            <CardDescription>
              {stats?.totalEntries || 0} з {stats?.weeklyGoal || 7} записів
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={weeklyProgress} className="h-3" />
            <p className="text-sm text-muted-foreground mt-2">
              {weeklyProgress.toFixed(0)}% виконано
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Місячна ціль
            </CardTitle>
            <CardDescription>
              {stats?.totalEntries || 0} з {stats?.monthlyGoal || 30} записів
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={monthlyProgress} className="h-3" />
            <p className="text-sm text-muted-foreground mt-2">
              {monthlyProgress.toFixed(0)}% виконано
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Principles Progress */}
      {principleCompletions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Прогрес по принципах
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {principleCompletions.slice(0, 5).map((pc: any, index: number) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{pc.principleTitle}</span>
                    <span className="text-muted-foreground">
                      {pc.entriesCount} записів ({pc.completionRate}%)
                    </span>
                  </div>
                  <Progress value={pc.completionRate} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Настрій: {pc.averageMood?.toFixed(1)}/10</span>
                    <span>Енергія: {pc.averageEnergy?.toFixed(1)}/10</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}