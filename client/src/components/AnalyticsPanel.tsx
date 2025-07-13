import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, TrendingDown, Calendar, Target, Flame, Heart, Zap, BookOpen } from "lucide-react";
import { apiRequest } from "@/lib/api";

export default function AnalyticsPanel() {
  const [selectedPeriod, setSelectedPeriod] = useState(30);

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['/api/analytics/overview'],
    enabled: true,
  });

  const { data: moodTrends } = useQuery({
    queryKey: ['/api/analytics/mood-trends', selectedPeriod],
    queryFn: () => apiRequest(`/api/analytics/mood-trends?days=${selectedPeriod}`, { method: 'GET' }).then(res => res.json()),
    enabled: true,
  });

  const { data: energyTrends } = useQuery({
    queryKey: ['/api/analytics/energy-trends', selectedPeriod],
    queryFn: () => apiRequest(`/api/analytics/energy-trends?days=${selectedPeriod}`, { method: 'GET' }).then(res => res.json()),
    enabled: true,
  });

  const { data: principleProgress } = useQuery({
    queryKey: ['/api/analytics/principle-progress'],
    enabled: true,
  });

  const { data: streakData } = useQuery({
    queryKey: ['/api/analytics/streaks'],
    enabled: true,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const overview = analytics?.overview || {};
  const trends = analytics?.trends || {};
  const goals = analytics?.goals || {};

  // Prepare data for charts
  const combinedTrends = moodTrends?.map((mood: any, index: number) => ({
    date: mood.date,
    mood: mood.mood,
    energy: energyTrends?.[index]?.energy || 0,
    entries: mood.entries
  })) || [];

  const principleColors = [
    "#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#00ff00",
    "#ff00ff", "#00ffff", "#ffff00", "#ff0000", "#0000ff"
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Аналітика та Прогрес</h1>
        <div className="flex gap-2">
          {[7, 30, 90].map(days => (
            <button
              key={days}
              onClick={() => setSelectedPeriod(days)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === days
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {days}д
            </button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Всього записів</p>
                <p className="text-2xl font-bold text-gray-900">{overview.totalEntries || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-full">
                <Flame className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Поточна серія</p>
                <p className="text-2xl font-bold text-gray-900">{overview.currentStreak || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-full">
                <Heart className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Середній настрій</p>
                <p className="text-2xl font-bold text-gray-900">{overview.averageMood?.toFixed(1) || '0.0'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <Zap className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Середня енергія</p>
                <p className="text-2xl font-bold text-gray-900">{overview.averageEnergy?.toFixed(1) || '0.0'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Тенденції</TabsTrigger>
          <TabsTrigger value="principles">Принципи</TabsTrigger>
          <TabsTrigger value="streaks">Серії</TabsTrigger>
          <TabsTrigger value="goals">Цілі</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Настрій та Енергія за період</CardTitle>
              <CardDescription>
                Відстеження змін настрою та рівня енергії протягом останніх {selectedPeriod} днів
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={combinedTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('uk-UA', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis domain={[0, 10]} />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString('uk-UA')}
                    formatter={(value: number, name: string) => [
                      value.toFixed(1), 
                      name === 'mood' ? 'Настрій' : 'Енергія'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="mood" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={{ fill: "#8884d8", strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="energy" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    dot={{ fill: "#82ca9d", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Активність записів</CardTitle>
              <CardDescription>Кількість записів за день</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={combinedTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('uk-UA', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString('uk-UA')}
                    formatter={(value: number) => [value, 'Записів']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="entries" 
                    stroke="#ffc658" 
                    fill="#ffc658" 
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="principles" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Прогрес по принципах</CardTitle>
                <CardDescription>Кількість записів для кожного принципу</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={principleProgress}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="principleNumber" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [value, 'Записів']}
                      labelFormatter={(value) => `Принцип ${value}`}
                    />
                    <Bar dataKey="entriesCount" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Розподіл по принципах</CardTitle>
                <CardDescription>Відсоткове співвідношення записів</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={principleProgress?.filter((p: any) => p.entriesCount > 0)}
                      dataKey="entriesCount"
                      nameKey="principleNumber"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ principleNumber, entriesCount }) => `${principleNumber}: ${entriesCount}`}
                    >
                      {principleProgress?.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={principleColors[index % principleColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Детальна статистика принципів</h3>
            <div className="grid gap-4">
              {principleProgress?.map((principle: any, index: number) => (
                <Card key={principle.principleId}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="text-sm">
                          {principle.principleNumber}
                        </Badge>
                        <h4 className="font-medium">{principle.principleTitle}</h4>
                      </div>
                      <div className="text-sm text-gray-500">
                        {principle.entriesCount} записів
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Середній настрій</p>
                        <p className="font-medium">{principle.averageMood.toFixed(1)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Середня енергія</p>
                        <p className="font-medium">{principle.averageEnergy.toFixed(1)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Останній запис</p>
                        <p className="font-medium">
                          {principle.lastEntry 
                            ? new Date(principle.lastEntry).toLocaleDateString('uk-UA')
                            : 'Немає'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Progress 
                        value={principle.completionRate} 
                        className="h-2"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {principle.completionRate.toFixed(1)}% від усіх записів
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="streaks" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="flex items-center p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-full">
                    <Flame className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Поточна серія</p>
                    <p className="text-3xl font-bold text-gray-900">{streakData?.currentStreak || 0}</p>
                    <p className="text-xs text-gray-500">днів поспіль</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-100 rounded-full">
                    <Target className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Найдовша серія</p>
                    <p className="text-3xl font-bold text-gray-900">{streakData?.longestStreak || 0}</p>
                    <p className="text-xs text-gray-500">максимум днів</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <Calendar className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Активних днів</p>
                    <p className="text-3xl font-bold text-gray-900">{streakData?.totalDaysWithEntries || 0}</p>
                    <p className="text-xs text-gray-500">всього</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {streakData?.streakDates?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Поточна серія</CardTitle>
                <CardDescription>Дні з записами в поточній серії</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {streakData.streakDates.map((date: string, index: number) => (
                    <Badge key={date} variant="secondary" className="text-sm">
                      {new Date(date).toLocaleDateString('uk-UA', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Тижневі цілі</CardTitle>
                <CardDescription>Прогрес виконання тижневих цілей</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Ціль: {goals.weekly} записів на тиждень</span>
                  <Badge variant={goals.weeklyCompletion >= 100 ? "default" : "secondary"}>
                    {goals.weeklyCompletion?.toFixed(0) || 0}%
                  </Badge>
                </div>
                <Progress value={Math.min(goals.weeklyCompletion || 0, 100)} className="h-3" />
                <p className="text-xs text-gray-500">
                  {Math.floor((goals.weeklyCompletion || 0) / 100 * goals.weekly)} з {goals.weekly} записів виконано
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Місячні цілі</CardTitle>
                <CardDescription>Прогрес виконання місячних цілей</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Ціль: {goals.monthly} записів на місяць</span>
                  <Badge variant="secondary">
                    {Math.floor((overview.totalEntries || 0) / goals.monthly * 100)}%
                  </Badge>
                </div>
                <Progress 
                  value={Math.min((overview.totalEntries || 0) / goals.monthly * 100, 100)} 
                  className="h-3" 
                />
                <p className="text-xs text-gray-500">
                  {overview.totalEntries || 0} з {goals.monthly} записів виконано
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}