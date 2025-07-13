import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, Flame, Heart, Target, Calendar, Zap } from 'lucide-react';
import { authUtils } from '@/utils/auth';
import { apiRequest } from '@/utils/apiRequest';

export function Achievements() {
  const { t } = useTranslation(['achievements', 'common']);

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

  // Define all achievements with progress tracking
  const allAchievements = [
    {
      id: 'first_entry',
      title: 'Перший крок',
      description: 'Зробіть ваш перший запис у щоденнику',
      icon: Star,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      unlocked: (stats?.totalEntries || 0) >= 1,
      progress: Math.min(100, ((stats?.totalEntries || 0) / 1) * 100)
    },
    {
      id: '7_days_streak',
      title: 'Тижневий марафон',
      description: 'Підтримуйте серію протягом 7 днів',
      icon: Flame,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      unlocked: (stats?.streakDays || 0) >= 7,
      progress: Math.min(100, ((stats?.streakDays || 0) / 7) * 100)
    },
    {
      id: 'gratitude_master',
      title: 'Майстер вдячності',
      description: 'Зробіть 10 записів про вдячність',
      icon: Heart,
      color: 'text-pink-500',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200',
      unlocked: (stats?.totalEntries || 0) >= 10,
      progress: Math.min(100, ((stats?.totalEntries || 0) / 10) * 100)
    },
    {
      id: 'karma_collector',
      title: 'Збирач карми',
      description: 'Накопичте 100 очок карми',
      icon: Trophy,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      unlocked: (stats?.totalEntries || 0) * 5 >= 100, // Assuming 5 karma per entry
      progress: Math.min(100, (((stats?.totalEntries || 0) * 5) / 100) * 100)
    },
    {
      id: 'month_champion',
      title: 'Чемпіон місяця',
      description: 'Досягніть місячної цілі',
      icon: Calendar,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      unlocked: (stats?.totalEntries || 0) >= (stats?.monthlyGoal || 30),
      progress: Math.min(100, ((stats?.totalEntries || 0) / (stats?.monthlyGoal || 30)) * 100)
    },
    {
      id: 'mood_master',
      title: 'Майстер настрою',
      description: 'Підтримуйте середній настрій вище 8',
      icon: Zap,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      unlocked: (stats?.averageMood || 0) >= 8,
      progress: Math.min(100, ((stats?.averageMood || 0) / 8) * 100)
    }
  ];

  const unlockedCount = allAchievements.filter(a => a.unlocked).length;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Досягнення
          </CardTitle>
          <CardDescription>
            Відкрито {unlockedCount} з {allAchievements.length} досягнень
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress 
            value={(unlockedCount / allAchievements.length) * 100} 
            className="h-3"
          />
          <p className="text-sm text-muted-foreground mt-2">
            {((unlockedCount / allAchievements.length) * 100).toFixed(0)}% завершено
          </p>
        </CardContent>
      </Card>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allAchievements.map((achievement) => {
          const Icon = achievement.icon;
          
          return (
            <Card 
              key={achievement.id}
              className={`relative overflow-hidden transition-all ${
                achievement.unlocked 
                  ? `${achievement.borderColor} ${achievement.bgColor} shadow-md` 
                  : 'opacity-75 bg-gray-50'
              }`}
            >
              {achievement.unlocked && (
                <div className="absolute top-2 right-2">
                  <Badge variant="default" className="text-xs">
                    Отримано
                  </Badge>
                </div>
              )}
              
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${achievement.unlocked ? achievement.bgColor : 'bg-gray-100'}`}>
                    <Icon className={`w-6 h-6 ${achievement.unlocked ? achievement.color : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{achievement.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {achievement.description}
                </p>
                
                {!achievement.unlocked && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Прогрес</span>
                      <span>{achievement.progress.toFixed(0)}%</span>
                    </div>
                    <Progress value={achievement.progress} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Motivational message for locked achievements */}
      {unlockedCount < allAchievements.length && (
        <Card className="border-dashed">
          <CardContent className="text-center py-8">
            <h3 className="text-lg font-semibold mb-2">Більше досягнень чекає на вас!</h3>
            <p className="text-muted-foreground">
              Продовжуйте вести щоденник та розвивати позитивну карму, 
              щоб відкрити всі досягнення.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}