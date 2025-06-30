import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export function StreakCard() {
  const { data: user } = useQuery({ queryKey: ['/api/user/me'] });
  const stats = user?.stats;

  return (
    <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-white/20 dark:border-slate-700/50 shadow-xl">
      <div className="h-1 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500"></div>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 text-white">
              <Flame className="w-4 h-4" />
            </div>
            Серія
          </CardTitle>
          <div className="text-right">
            <div className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              {stats?.streakDays || 0}
            </div>
            <div className="text-xs text-muted-foreground">днів</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Найдовша серія</span>
            <span className="font-medium">{stats?.longestStreak || 0} днів</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Продовжуйте записувати щодня</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}