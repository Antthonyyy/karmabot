import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export function NextPrincipleCard() {
  const { data: user } = useQuery({ queryKey: ['/api/user/me'] });
  const { data: principle } = useQuery({ 
    queryKey: ['/api/principles', user?.currentPrinciple],
    enabled: !!user?.currentPrinciple 
  });

  return (
    <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-white/20 dark:border-slate-700/50 shadow-xl">
      <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500"></div>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              <BookOpen className="w-4 h-4" />
            </div>
            Поточний принцип
          </CardTitle>
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {user?.currentPrinciple || 1}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-sm font-medium">
            {principle?.title || 'Принцип доброти та співчуття'}
          </div>
          <div className="text-xs text-muted-foreground line-clamp-2">
            {principle?.description || 'Розвивайте доброту до себе та інших через щоденну практику'}
          </div>
          <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-medium">
            <span>Продовжити вивчення</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}