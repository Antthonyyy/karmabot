import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Flame, Book, RotateCcw, CheckCircle, TrendingUp } from "lucide-react";
import { User } from "@/lib/types";

interface ProgressChartProps {
  user: User;
}

export default function ProgressChart({ user }: ProgressChartProps) {
  const stats = user.stats || {
    streakDays: 0,
    totalEntries: 0,
    currentCycle: 1,
    principleProgress: {}
  };

  // Mock data for demonstration - in real app this would come from API
  const weeklyActivity = [true, true, true, false, true, false, false];
  const principlesMastery = Array.from({ length: 10 }, (_, i) => ({
    number: i + 1,
    title: `Принцип ${i + 1}`,
    progress: i < user.currentPrinciple ? Math.floor(Math.random() * 40) + 60 : 
             i === user.currentPrinciple ? Math.floor(Math.random() * 30) + 20 : 0,
    completed: i < user.currentPrinciple
  }));

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Днів поспіль</h3>
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-3xl font-bold text-blue-600 mb-2">{stats.streakDays}</p>
            <p className="text-sm text-gray-500">Ваш найкращий результат: 45 днів</p>
            <div className="mt-4">
              <Progress value={(stats.streakDays / 45) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Записів в щоденнику</h3>
              <Book className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-blue-600 mb-2">{stats.totalEntries}</p>
            <p className="text-sm text-gray-500">+5 за останній тиждень</p>
            <div className="mt-4 flex items-center space-x-1">
              {weeklyActivity.map((active, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full ${
                    active ? "bg-green-500" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Поточний цикл</h3>
              <RotateCcw className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-blue-600 mb-2">{stats.currentCycle}</p>
            <p className="text-sm text-gray-500">Принцип {user.currentPrinciple} з 10</p>
            <div className="mt-4">
              <Progress value={(user.currentPrinciple / 10) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Активність за місяць</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Графік активності</p>
              <p className="text-sm text-gray-400">Інтеграція з Chart.js буде додана</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Principles Mastery */}
      <Card>
        <CardHeader>
          <CardTitle>Опанування принципів</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {principlesMastery.map((principle) => (
              <div key={principle.number} className="text-center">
                <div className="relative inline-block mb-3">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                    principle.completed
                      ? "bg-green-100 text-green-600"
                      : principle.number === user.currentPrinciple
                      ? "bg-blue-100 text-blue-600 ring-2 ring-blue-500"
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    <span className="font-bold">{principle.number}</span>
                  </div>
                  {principle.completed && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                
                <p className="text-sm font-medium text-gray-900 mb-2">
                  {principle.title}
                </p>
                
                <div className="mb-2">
                  <Progress value={principle.progress} className="h-1" />
                </div>
                
                <p className="text-xs text-gray-500">{principle.progress}%</p>
                
                {principle.number === user.currentPrinciple && (
                  <Badge variant="default" className="mt-2 text-xs">
                    Поточний
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
