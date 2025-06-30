import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Achievements } from '@/components/Achievements';
import { Trophy } from 'lucide-react';

export default function AchievementsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-yellow-50 to-orange-50 dark:from-slate-900 dark:via-yellow-900 dark:to-orange-900 pt-20 pb-24 px-4">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-yellow-400/20 to-orange-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-60 right-20 w-96 h-96 bg-gradient-to-r from-orange-400/15 to-red-600/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-gradient-to-r from-amber-400/10 to-yellow-600/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-white/20 dark:border-slate-700/50 shadow-xl mb-6">
          <div className="h-1 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500"></div>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 text-white shadow-lg">
                <Trophy className="w-6 h-6" />
              </div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 bg-clip-text text-transparent">
                Досягнення
              </CardTitle>
            </div>
            <p className="text-muted-foreground">
              Відстежуйте свій прогрес та святкуйте досягнення на шляху розвитку
            </p>
          </CardHeader>
          <CardContent>
            <Achievements />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}