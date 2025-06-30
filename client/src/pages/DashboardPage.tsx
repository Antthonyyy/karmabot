import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, Trophy, Sparkles, ChevronRight, LogOut, Menu, X, Settings, Calendar, Target, Zap, BookOpen } from 'lucide-react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLocation } from "wouter";
import { AIChat } from '@/components/AIChat';
import { JournalQuickAdd } from '@/components/JournalQuickAdd';
import { KarmaStats } from '@/components/KarmaStats';
import { Achievements } from '@/components/Achievements';
import { Logo } from '@/components/Logo';

import { AIBudgetStatus } from "@/components/AIBudgetStatus";
import TodaysPlan from "@/components/TodaysPlan";
import NextPrincipleCard from "@/components/NextPrincipleCard";
import AIDailyInsight from "@/components/AIDailyInsight";
import OnboardingModal from "@/components/OnboardingModal";
import { useOnboarding } from "@/hooks/useOnboarding";
import { authUtils } from '@/utils/auth';
import { checkAuthError, handleAuthError } from '@/utils/auth-recovery';
import { useToast } from '@/hooks/use-toast';
import type { User, Principle } from '@shared/schema';

export default function DashboardPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { showOnboarding, completeOnboarding } = useOnboarding();

  // Redirect if not authenticated
  if (!authUtils.getToken()) {
    setLocation("/");
    return null;
  }

  const handleLogout = () => {
    authUtils.clearAuth();
    setLocation("/");
  };

  // Fetch user data
  const { data: user, error: userError, isLoading: userLoading } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/user/me", {
          headers: authUtils.getAuthHeaders(),
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error response:', errorData);
          
          if (response.status === 403 || response.status === 401) {
            handleAuthError();
            return;
          }
          
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('User data received:', data);
        return data;
      } catch (error) {
        console.error('Fetch error:', error);
        
        if (checkAuthError(error)) {
          handleAuthError();
          return;
        }
        
        throw error;
      }
    },
    retry: false,
    enabled: !!authUtils.getToken(),
  });

  // Fetch subscription data
  const { data: subscription } = useQuery({
    queryKey: ['current-subscription'],
    queryFn: async () => {
      const res = await fetch('/api/subscriptions/current', {
        headers: authUtils.getAuthHeaders()
      });
      if (!res.ok) throw new Error('Failed to fetch subscription');
      return res.json();
    }
  });

  // Fetch principles data
  const { data: principles } = useQuery<Principle[]>({
    queryKey: ["/api/principles"],
  });

  // Handle authentication errors
  useEffect(() => {
    if (userError) {
      const errorObj = userError as any;
      if (errorObj?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/auth';
      }
    }
  }, [userError]);

  // Loading state
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  // Error state
  if (userError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Помилка</h1>
          <p className="text-muted-foreground">Не вдалося завантажити дані користувача</p>
        </div>
      </div>
    );
  }

  // Not authenticated state
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Авторизація потрібна</h1>
          <p className="text-muted-foreground mb-4">Будь ласка, увійдіть в систему</p>
          <a 
            href="/auth" 
            className="inline-flex items-center px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700"
          >
            Увійти
          </a>
        </div>
      </div>
    );
  }

  function getGreeting() {
    const hour = new Date().getHours();
    const name = user?.firstName || "Друже";
    
    if (hour < 12) return `Доброго ранку, ${name}!`;
    if (hour < 17) return `Добрий день, ${name}!`;
    return `Добрий вечір, ${name}!`;
  }

  function getMotivationalQuote() {
    const quotes = [
      "Кожен день - це новий початок для створення позитивної карми",
      "Ваші добрі справи сьогодні формують ваше щасливе завтра",
      "Маленькі кроки кожен день ведуть до великих змін",
      "Карма - це не покарання, а можливість для зростання",
      "Ваша позитивна енергія змінює світ навколо вас"
    ];
    
    return quotes[Math.floor(Math.random() * quotes.length)];
  }

  const tabsConfig = [
    {
      value: "overview",
      label: "Огляд",
      icon: BookOpen,
    },
    {
      value: "ai-chat", 
      label: "AI Чат",
      icon: Brain,
    },
    {
      value: "analytics",
      label: "Аналітика", 
      icon: TrendingUp,
    },
    {
      value: "achievements",
      label: "Досягнення",
      icon: Trophy,
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 left-1/4 w-28 h-28 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="container mx-auto px-4 py-6 relative z-10">
        {/* Mobile-First Header */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
              {getGreeting()}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground px-4">
              {getMotivationalQuote()}
            </p>
          </div>

          {/* Mobile-optimized Navigation Tabs */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-white/20 dark:border-slate-700/50 rounded-2xl p-1 shadow-lg">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
              {tabsConfig.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    className={`
                      flex flex-col items-center justify-center py-3 px-2 rounded-xl transition-all duration-200
                      ${activeTab === tab.value 
                        ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg scale-105' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-slate-800/50'
                      }
                    `}
                  >
                    <IconComponent className="w-5 h-5 mb-1" />
                    <span className="text-xs sm:text-sm font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Add - Enhanced Mobile Design */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-violet-50/50 via-purple-50/30 to-blue-50/50 dark:from-violet-950/30 dark:via-purple-950/20 dark:to-blue-950/30 backdrop-blur-xl border-gradient shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-purple-500/5 to-blue-500/5"></div>
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-blue-500"></div>
              <CardHeader className="relative pb-4">
                <CardTitle className="text-xl font-bold flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                      Швидкий запис
                    </div>
                    <div className="text-sm font-normal text-muted-foreground mt-1">
                      Поділіться своїми думками та переживаннями
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <JournalQuickAdd onSuccess={() => {
                  toast({
                    title: "Успіх",
                    description: "Запис додано до щоденника"
                  });
                  queryClient.invalidateQueries({ queryKey: ["user"] });
                }} />
              </CardContent>
            </Card>

            {/* Stats Cards Grid - Mobile Responsive */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Streak Card */}
              <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 dark:from-orange-500/20 dark:to-red-500/20 backdrop-blur-md border-orange-200/50 dark:border-orange-700/50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">🔥</div>
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{user?.stats?.streakDays || 0}</div>
                  <div className="text-sm text-muted-foreground">Дні поспіль</div>
                </CardContent>
              </Card>

              {/* Entries Card */}
              <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 backdrop-blur-md border-blue-200/50 dark:border-blue-700/50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">📝</div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{user?.stats?.totalEntries || 0}</div>
                  <div className="text-sm text-muted-foreground">Записів</div>
                </CardContent>
              </Card>

              {/* Principle Card */}
              <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20 backdrop-blur-md border-green-200/50 dark:border-green-700/50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">🌸</div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{user?.currentPrinciple || 1}</div>
                  <div className="text-sm text-muted-foreground">Принцип</div>
                </CardContent>
              </Card>

              {/* Weekly Goal Card */}
              <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 dark:from-yellow-500/20 dark:to-orange-500/20 backdrop-blur-md border-yellow-200/50 dark:border-yellow-700/50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">🎯</div>
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{Math.round(((user?.stats?.totalEntries || 0) / (user?.stats?.weeklyGoal || 7)) * 100)}%</div>
                  <div className="text-sm text-muted-foreground">Прогрес</div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Grid - Responsive */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Today's Plan */}
                <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-white/20 dark:border-slate-700/50 overflow-hidden shadow-lg">
                  <TodaysPlan />
                </Card>

                {/* Next Principle */}
                {user && principles && (
                  <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-white/20 dark:border-slate-700/50 overflow-hidden shadow-lg">
                    <div className="h-1 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500"></div>
                    <NextPrincipleCard 
                      currentPrinciple={user.currentPrinciple}
                      principles={principles}
                    />
                  </Card>
                )}


              </div>

              {/* Right Column - Sidebar */}
              <div className="space-y-6">
                {/* AI Budget Status */}
                <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-white/20 dark:border-slate-700/50 overflow-hidden shadow-lg">
                  <div className="h-1 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500"></div>
                  <AIBudgetStatus />
                </Card>

                {/* Quick Actions */}
                <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-white/20 dark:border-slate-700/50 shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-violet-500" />
                      Швидкі дії
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start h-auto p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/50 dark:hover:to-indigo-900/50"
                      onClick={() => setLocation('/journal')}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <BookOpen className="w-4 h-4" />
                        <div className="text-left">
                          <div className="font-medium text-sm">Переглянути записи</div>
                          <div className="text-xs text-muted-foreground">Останні записи щоденника</div>
                        </div>
                        <ChevronRight className="w-4 h-4 ml-auto" />
                      </div>
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start h-auto p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/50 dark:hover:to-pink-900/50"
                      onClick={() => setLocation('/settings')}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <Target className="w-4 h-4" />
                        <div className="text-left">
                          <div className="font-medium text-sm">Налаштування</div>
                          <div className="text-xs text-muted-foreground">Налаштувати цілі та нагадування</div>
                        </div>
                        <ChevronRight className="w-4 h-4 ml-auto" />
                      </div>
                    </Button>
                  </CardContent>
                </Card>

                {/* Current Principle Overview */}
                {principles && (
                  <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-white/20 dark:border-slate-700/50 shadow-lg">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-emerald-500" />
                        Поточний принцип
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                          Принцип {user?.currentPrinciple || 1}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          {principles.find(p => p.number === (user?.currentPrinciple || 1))?.title || "Завантаження..."}
                        </p>
                        <Progress 
                          value={((user?.currentPrinciple || 1) / 10) * 100} 
                          className="h-2" 
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Прогрес</span>
                          <span>{user?.currentPrinciple || 1}/10</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ai-chat">
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-white/20 dark:border-slate-700/50 overflow-hidden shadow-lg">
              <div className="h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500"></div>
              <AIChat />
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-white/20 dark:border-slate-700/50 overflow-hidden shadow-lg">
              <div className="h-1 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500"></div>
              <KarmaStats />
            </Card>
          </TabsContent>

          <TabsContent value="achievements">
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-white/20 dark:border-slate-700/50 overflow-hidden shadow-lg">
              <div className="h-1 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500"></div>
              <Achievements />
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Onboarding Modal */}
      {showOnboarding && (
        <OnboardingModal 
          isOpen={showOnboarding} 
          onComplete={completeOnboarding}
        />
      )}
    </div>
  );
}