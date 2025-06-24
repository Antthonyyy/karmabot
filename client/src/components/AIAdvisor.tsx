import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { authUtils } from '@/utils/auth';
import { SubscriptionRequired } from './SubscriptionRequired';

export function AIAdvisor() {
  const [advice, setAdvice] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Check subscription features
  const { data: features } = useQuery({
    queryKey: ['subscription-features'],
    queryFn: async () => {
      const response = await fetch('/api/subscriptions/features', {
        headers: authUtils.getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch features');
      return response.json();
    }
  });
  
  const getAdvice = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/advice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('AI Response status:', response.status);
      
      // Read response as text first
      const responseText = await response.text();
      console.log('AI Response text:', responseText);
      
      // Check if response is not empty
      if (!responseText) {
        throw new Error('Empty response from server');
      }
      
      // Parse JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse JSON:', e);
        throw new Error('Invalid JSON response');
      }
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get advice');
      }
      
      if (data.advice) {
        setAdvice(data.advice);
      } else {
        throw new Error('No advice in response');
      }
    } catch (error) {
      console.error('Error getting AI advice:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося отримати AI-пораду. Спробуйте пізніше.",
        variant: "destructive"
      });
    }
    setLoading(false);
  };
  
  return (
    <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border-purple-200 dark:border-purple-800">
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 animate-pulse" />
          AI-помічник
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={getAdvice}
          disabled={loading}
          className="flex items-center gap-2 bg-purple-600 text-white hover:bg-purple-700 w-full sm:w-auto"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
          <span className="text-sm sm:text-base">
            {loading ? 'AI аналізує...' : 'Отримати пораду'}
          </span>
        </Button>
        
        {advice && (
          <div className="p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg border">
            <h3 className="font-semibold mb-2 flex items-center gap-2 text-sm sm:text-base">
              🤖 Персональна порада:
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed italic text-sm sm:text-base">
              "{advice}"
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}