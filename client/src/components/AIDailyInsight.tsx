import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

async function fetchDailyInsight(principleId: number, regenerate = false) {
  const response = await fetch(
    `/api/insights/daily/${principleId}${regenerate ? '?regenerate=true' : ''}`,
    {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('karma_token')}`
      }
    }
  );
  if (!response.ok) throw new Error('Failed to fetch insight');
  return response.json();
}

interface AIDailyInsightProps {
  principleId: number;
  className?: string;
}

export default function AIDailyInsight({ principleId, className }: AIDailyInsightProps) {
  // Guard against undefined principleId
  if (!principleId || isNaN(principleId)) {
    return null;
  }
  const queryClient = useQueryClient();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['daily-insight', principleId],
    queryFn: () => fetchDailyInsight(principleId),
    staleTime: 1000 * 60 * 60 * 24, // Cache for 24 hours
    retry: 1,
  });
  
  const regenerateMutation = useMutation({
    mutationFn: () => fetchDailyInsight(principleId, true),
    onSuccess: (newData) => {
      queryClient.setQueryData(['daily-insight', principleId], newData);
    },
  });
  
  const insight = data?.insight || '';
  
  if (error && !insight) {
    return null; // Don't show if there's an error and no fallback
  }
  
  return (
    <Card className={`bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border-purple-200 dark:border-purple-800 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-purple-600 animate-pulse" />
          Підказка дня
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => regenerateMutation.mutate()}
          disabled={regenerateMutation.isPending}
          title="Оновити підказку"
        >
          <RefreshCw className={`h-4 w-4 ${regenerateMutation.isPending ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <div className="animate-pulse h-4 bg-purple-200 dark:bg-purple-700 rounded w-3/4" />
            <div className="animate-pulse h-4 bg-purple-200 dark:bg-purple-700 rounded w-1/2" />
          </div>
        ) : (
          <p className="text-base italic text-gray-700 dark:text-gray-300 leading-relaxed">
            "{insight}"
          </p>
        )}
      </CardContent>
    </Card>
  );
}