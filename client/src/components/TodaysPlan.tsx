import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, Target } from 'lucide-react';

export function TodaysPlan() {
  const today = new Date().toLocaleDateString('uk-UA', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });

  const todaysTasks = [
    { id: 1, text: 'Ранкова рефлексія', completed: true },
    { id: 2, text: 'Запис у щоденник', completed: false },
    { id: 3, text: 'Вечірня медитація', completed: false },
  ];

  return (
    <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-white/20 dark:border-slate-700/50 shadow-xl">
      <div className="h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500"></div>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white">
            <Target className="w-4 h-4" />
          </div>
          План на сьогодні
        </CardTitle>
        <p className="text-xs text-muted-foreground capitalize">{today}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {todaysTasks.map((task) => (
            <div key={task.id} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                task.completed 
                  ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400' 
                  : 'bg-muted border-2 border-dashed border-muted-foreground/30'
              }`}>
                {task.completed ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <Clock className="w-3 h-3 text-muted-foreground" />
                )}
              </div>
              <span className={`text-sm ${
                task.completed 
                  ? 'line-through text-muted-foreground' 
                  : 'text-foreground'
              }`}>
                {task.text}
              </span>
            </div>
          ))}
          <div className="pt-2 border-t border-muted">
            <div className="text-xs text-muted-foreground">
              Виконано: {todaysTasks.filter(t => t.completed).length}/{todaysTasks.length}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}