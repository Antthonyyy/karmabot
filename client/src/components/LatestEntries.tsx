import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function LatestEntries() {
  const { data: entries } = useQuery({ queryKey: ['/api/entries'] });
  const latestEntries = Array.isArray(entries) ? entries.slice(0, 3) : [];

  if (latestEntries.length === 0) {
    return (
      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-white/20 dark:border-slate-700/50 shadow-xl">
        <div className="h-1 bg-gradient-to-r from-slate-500 via-gray-500 to-zinc-500"></div>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-slate-500 to-gray-600 text-white">
              <FileText className="w-4 h-4" />
            </div>
            Останні записи
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Поки що немає записів</p>
            <p className="text-sm">Натисніть кнопку + щоб додати перший запис</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-white/20 dark:border-slate-700/50 shadow-xl">
      <div className="h-1 bg-gradient-to-r from-slate-500 via-gray-500 to-zinc-500"></div>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-slate-500 to-gray-600 text-white">
            <FileText className="w-4 h-4" />
          </div>
          Останні записи
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {latestEntries.map((entry: any) => (
            <div key={entry.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
              <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground line-clamp-2 mb-1">
                  {entry.content}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>
                    {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString('uk-UA') : 'Сьогодні'}
                  </span>
                  {entry.mood && (
                    <>
                      <span>•</span>
                      <span>{entry.mood}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div className="pt-2 border-t border-muted">
            <p className="text-xs text-muted-foreground text-center">
              Показано {latestEntries.length} останніх записів
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}