import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Target, Zap, Award, Medal } from 'lucide-react';

export default function AchievementsPage() {
  const achievements = [
    {
      id: 1,
      title: 'Перший запис',
      description: 'Створіть свій перший запис у щоденнику',
      icon: Trophy,
      unlocked: false,
      progress: 0,
      total: 1,
    },
    {
      id: 2,
      title: 'Серія з 7 днів',
      description: 'Ведіть щоденник 7 днів поспіль',
      icon: Star,
      unlocked: false,
      progress: 0,
      total: 7,
    },
    {
      id: 3,
      title: 'Перший принцип',
      description: 'Завершіть роботу з першим принципом карми',
      icon: Target,
      unlocked: false,
      progress: 0,
      total: 1,
    },
    {
      id: 4,
      title: 'Енергійний',
      description: 'Досягніть високого рівня енергії 10 разів',
      icon: Zap,
      unlocked: false,
      progress: 0,
      total: 10,
    },
    {
      id: 5,
      title: 'Медитатор',
      description: 'Проведіть 30 днів з регулярними записами',
      icon: Award,
      unlocked: false,
      progress: 0,
      total: 30,
    },
    {
      id: 6,
      title: 'Майстер карми',
      description: 'Завершіть роботу з усіма 10 принципами',
      icon: Medal,
      unlocked: false,
      progress: 0,
      total: 10,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-white to-orange-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            Досягнення
          </h1>
          <p className="text-muted-foreground mt-2">
            Відстежуйте свій прогрес та святкуйте успіхи
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievements.map((achievement) => {
            const IconComponent = achievement.icon;
            const progressPercent = Math.round((achievement.progress / achievement.total) * 100);
            
            return (
              <Card 
                key={achievement.id} 
                className={`transition-all duration-300 ${
                  achievement.unlocked 
                    ? 'border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20' 
                    : 'opacity-75 hover:opacity-100'
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${
                      achievement.unlocked 
                        ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    {achievement.unlocked && (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30">
                        Відкрито
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">{achievement.title}</CardTitle>
                </CardHeader>
                
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {achievement.description}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Прогрес</span>
                      <span>{achievement.progress}/{achievement.total}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          achievement.unlocked 
                            ? 'bg-gradient-to-r from-amber-400 to-orange-500' 
                            : 'bg-muted-foreground/30'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Загальна статистика
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">0</div>
                <div className="text-sm text-muted-foreground">Відкритих досягнень</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">6</div>
                <div className="text-sm text-muted-foreground">Всього досягнень</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">0%</div>
                <div className="text-sm text-muted-foreground">Завершено</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">0</div>
                <div className="text-sm text-muted-foreground">Очки досягнень</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}