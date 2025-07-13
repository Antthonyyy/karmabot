import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, DollarSign, Zap } from 'lucide-react';
import { authUtils } from '@/utils/auth';
import { apiRequest } from '@/utils/api';

export function AIBudgetStatus() {
  const { data: budgetData, isLoading } = useQuery({
    queryKey: ['ai-budget'],
    queryFn: async () => {
      const response = await apiRequest('/api/ai/budget', { method: 'GET' });
      if (!response.ok) throw new Error('Failed to fetch budget');
      return response.json();
    },
    refetchInterval: 60000 // Refresh every minute
  });

  if (isLoading || !budgetData) {
    return null;
  }

  const { budget, userUsage } = budgetData;

  const getAlertColor = () => {
    switch (budget.alertLevel) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getProgressColor = () => {
    switch (budget.alertLevel) {
      case 'critical': return 'bg-red-500';
      case 'warning': return 'bg-orange-500';
      default: return 'bg-green-500';
    }
  };

  return (
    <Card className={`${getAlertColor()}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <DollarSign className="w-4 h-4" />
          AI Бюджет
          {budget.alertLevel !== 'normal' && (
            <AlertTriangle className="w-4 h-4" />
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Global Budget */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span>Загальний бюджет</span>
            <span>${budget.used.toFixed(2)} / ${budget.limit}</span>
          </div>
          <Progress 
            value={budget.percentage} 
            className="h-2"
            style={{
              backgroundColor: budget.percentage > 90 ? '#fee2e2' : 
                             budget.percentage > 75 ? '#fef3c7' : '#f0f9ff'
            }}
          />
          <p className="text-xs mt-1">
            Залишилось: ${budget.remaining.toFixed(2)}
          </p>
        </div>

        {/* User Usage */}
        {userUsage.count > 0 && (
          <div className="border-t pt-3">
            <div className="flex items-center gap-1 text-xs mb-2">
              <Zap className="w-3 h-3" />
              Ваше використання цього місяця
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <div className="font-medium">{userUsage.count}</div>
                <div className="text-xs opacity-70">запитів</div>
              </div>
              <div>
                <div className="font-medium">{userUsage.tokens}</div>
                <div className="text-xs opacity-70">токенів</div>
              </div>
              <div>
                <div className="font-medium">${userUsage.cost.toFixed(3)}</div>
                <div className="text-xs opacity-70">вартість</div>
              </div>
            </div>
          </div>
        )}

        {/* Alert Messages */}
        {budget.alertLevel === 'critical' && (
          <div className="text-xs font-medium">
            ⚠️ Бюджет майже вичерпано! AI функції можуть бути обмежені.
          </div>
        )}
        {budget.alertLevel === 'warning' && (
          <div className="text-xs font-medium">
            ⚡ Використано {budget.percentage.toFixed(0)}% бюджету
          </div>
        )}
      </CardContent>
    </Card>
  );
}