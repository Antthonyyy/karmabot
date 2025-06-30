import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, Trophy, Sparkles, ChevronRight, LogOut, Menu, X, Settings } from 'lucide-react';
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
  const { data: principles } = useQuery({
    queryKey: ['principles'],
    queryFn: async () => {
      const res = await fetch('/api/principles', {
        headers: authUtils.getAuthHeaders()
      });
      if (!res.ok) throw new Error('Failed to fetch principles');
      return res.json();
    }
  });

  const getGreeting = () => {
    const name = user?.firstName || 'Користувач';
    return `Вітаю, ${name}!`;
  };

  const getMotivationalQuote = () => {
    const quotes = [
      'Кожен день - новий шанс стати кращим',
      'Ваші дії сьогодні формують вашу карму завтра',
      'Доброта - це мова, яку розуміють усі',
      'Позитивна енергія притягує позитивні зміни',
      'Розвиток душі - найважливіша подорож'
    ];
    const today = new Date().getDay();
    return quotes[today % quotes.length];
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Завантаження...</p>
        </div>
      </div>
    );
  }

  if (userError || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Помилка завантаження профілю</p>
          <Button onClick={handleLogout}>Повернутися на головну</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Logo size={40} />
                <div className="flex flex-col">
                  <h1 className="font-bold bg-gradient-to-r from-purple-600 to-purple-800 dark:from-purple-400 dark:to-purple-600 bg-clip-text text-transparent text-[19px]">
                    Кармічний Щоденник
                  </h1>
                  <p className="text-xs text-purple-600/70 dark:text-purple-400/70">
                    День {user?.stats?.streakDays || 0} • Принцип {user?.currentPrinciple || 1}
                  </p>
                </div>
              </div>
              
              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center gap-2 ml-8">
                <Button
                  variant={activeTab === "overview" ? "default" : "ghost"}
                  onClick={() => setActiveTab("overview")}
                  className="flex items-center gap-2 h-9"
                  size="sm"
                >
                  <Sparkles className="w-4 h-4" />
                  Огляд
                </Button>
                <Button
                  variant={activeTab === "ai-chat" ? "default" : "ghost"}
                  onClick={() => setActiveTab("ai-chat")}
                  className="flex items-center gap-2 h-9"
                  size="sm"
                >
                  <Brain className="w-4 h-4" />
                  AI-чат
                </Button>
                <Button
                  variant={activeTab === "analytics" ? "default" : "ghost"}
                  onClick={() => setActiveTab("analytics")}
                  className="flex items-center gap-2 h-9"
                  size="sm"
                >
                  <TrendingUp className="w-4 h-4" />
                  Аналітика
                </Button>
                <Button
                  variant={activeTab === "achievements" ? "default" : "ghost"}
                  onClick={() => setActiveTab("achievements")}
                  className="flex items-center gap-2 h-9"
                  size="sm"
                >
                  <Trophy className="w-4 h-4" />
                  Досягнення
                </Button>
                <div className="w-px h-6 bg-border mx-2" />
                <Button
                  variant="ghost"
                  onClick={() => setLocation("/settings")}
                  className="flex items-center gap-2 h-9"
                  size="sm"
                >
                  <Settings className="w-4 h-4" />
                  Налаштування
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* User info with karma points */}
              <div className="hidden md:flex items-center gap-4">
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-sm font-medium text-purple-600 dark:text-purple-400">
                      <Sparkles className="w-3 h-3" />
                      {user?.stats?.totalEntries || 0} записів
                    </div>
                    <div className="w-px h-4 bg-border" />
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Trophy className="w-3 h-3" />
                      {user?.stats?.streakDays || 0} днів
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {user.firstName}
                  </p>
                </div>
                <Avatar className="w-9 h-9 ring-2 ring-purple-200 dark:ring-purple-800">
                  <AvatarFallback className="bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-800 dark:to-purple-900 text-purple-700 dark:text-purple-300">
                    {user.firstName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </div>

              <Button variant="ghost" size="sm" onClick={handleLogout} className="hidden md:flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                Вихід
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t bg-gradient-to-r from-purple-50/50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/20">
            <div className="container px-4 py-4 space-y-3">
              {/* User info in mobile */}
              <div className="flex items-center gap-3 pb-3 border-b border-purple-200 dark:border-purple-800">
                <Avatar className="w-10 h-10 ring-2 ring-purple-200 dark:ring-purple-800">
                  <AvatarFallback className="bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-800 dark:to-purple-900 text-purple-700 dark:text-purple-300">
                    {user.firstName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user.firstName}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {user?.stats?.totalEntries || 0} записів
                    </span>
                    <span className="flex items-center gap-1">
                      <Trophy className="w-3 h-3" />
                      {user?.stats?.streakDays || 0} днів
                    </span>
                  </div>
                </div>
              </div>

              {/* Navigation tabs */}
              <div className="space-y-1">
                <Button 
                  variant={activeTab === "overview" ? "default" : "ghost"} 
                  className="w-full justify-start h-10" 
                  onClick={() => {
                    setActiveTab("overview");
                    setMobileMenuOpen(false);
                  }}
                >
                  <Sparkles className="w-4 h-4 mr-3" />
                  Огляд
                </Button>
                <Button 
                  variant={activeTab === "ai-chat" ? "default" : "ghost"} 
                  className="w-full justify-start h-10" 
                  onClick={() => {
                    setActiveTab("ai-chat");
                    setMobileMenuOpen(false);
                  }}
                >
                  <Brain className="w-4 h-4 mr-3" />
                  AI-чат
                </Button>
                <Button 
                  variant={activeTab === "analytics" ? "default" : "ghost"} 
                  className="w-full justify-start h-10" 
                  onClick={() => {
                    setActiveTab("analytics");
                    setMobileMenuOpen(false);
                  }}
                >
                  <TrendingUp className="w-4 h-4 mr-3" />
                  Аналітика
                </Button>
                <Button 
                  variant={activeTab === "achievements" ? "default" : "ghost"} 
                  className="w-full justify-start h-10" 
                  onClick={() => {
                    setActiveTab("achievements");
                    setMobileMenuOpen(false);
                  }}
                >
                  <Trophy className="w-4 h-4 mr-3" />
                  Досягнення
                </Button>
                
                <div className="w-full h-px bg-border my-2" />
                
                <Button variant="ghost" className="w-full justify-start h-10" onClick={() => setLocation("/settings")}>
                  <Settings className="w-4 h-4 mr-3" />
                  Налаштування
                </Button>
                <Button variant="ghost" className="w-full justify-start h-10" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-3" />
                  Вихід
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>
      {/* Onboarding Modal */}
      {showOnboarding && (
        <OnboardingModal 
          isOpen={showOnboarding}
          onComplete={completeOnboarding}
        />
      )}
      {/* Main Content */}
      <div className="relative">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-gradient-to-br from-emerald-400/8 to-teal-400/8 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        <div className="container max-w-7xl mx-auto py-8 px-4 relative z-10">
          {/* Enhanced Header */}
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <span className="text-2xl">🌸</span>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                {getGreeting()}
              </h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {getMotivationalQuote()}
            </p>
          </div>

          {/* Enhanced Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsContent value="overview" className="space-y-8">
              {/* Quick Add Section with enhanced styling */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-blue-500/5 rounded-3xl blur-xl"></div>
                <div className="relative bg-background/80 backdrop-blur-sm border border-border/50 rounded-3xl p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                      <span className="text-lg">✨</span>
                    </div>
                    <h2 className="text-xl font-semibold">Швидкий запис</h2>
                  </div>
                  <JournalQuickAdd onSuccess={() => {
                    toast({
                      title: "Успіх",
                      description: "Запис додано до щоденника"
                    });
                    queryClient.invalidateQueries({ queryKey: ["user"] });
                  }} />
                </div>
              </div>

              {/* Main dashboard content with enhanced grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  {/* Today's Plan with glass morphism */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                    <div className="relative bg-background/90 backdrop-blur-sm border border-border/50 rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                      <TodaysPlan />
                    </div>
                  </div>
                  
                  {/* Next Principle Card with enhanced styling */}
                  {user && principles && (
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                      <div className="relative bg-background/90 backdrop-blur-sm border border-border/50 rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500"></div>
                        <NextPrincipleCard 
                          currentPrinciple={user.currentPrinciple}
                          principles={principles}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* AI Daily Insight with enhanced styling */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                    <div className="relative bg-background/90 backdrop-blur-sm border border-border/50 rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500"></div>
                      <AIDailyInsight principleId={user?.currentPrinciple || 1} />
                    </div>
                  </div>
                </div>

                {/* Sidebar with enhanced styling */}
                <div className="lg:col-span-1 space-y-8">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                    <div className="relative bg-background/90 backdrop-blur-sm border border-border/50 rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500"></div>
                      <AIBudgetStatus />
                    </div>
                  </div>

                  {/* Additional decorative card */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                    <div className="relative bg-background/90 backdrop-blur-sm border border-border/50 rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500"></div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                          <span className="text-lg">🎯</span>
                        </div>
                        <h3 className="text-lg font-semibold">Сьогоднішня мета</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Сфокусуйтесь на поточному принципі та знайдіть можливості для його практики
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span>Активний день</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ai-chat" className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-3xl blur-xl"></div>
              <div className="relative bg-background/90 backdrop-blur-sm border border-border/50 rounded-3xl overflow-hidden shadow-lg">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500"></div>
                <AIChat />
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 rounded-3xl blur-xl"></div>
              <div className="relative bg-background/90 backdrop-blur-sm border border-border/50 rounded-3xl overflow-hidden shadow-lg">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500"></div>
                <KarmaStats />
              </div>
            </TabsContent>

            <TabsContent value="achievements" className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 rounded-3xl blur-xl"></div>
              <div className="relative bg-background/90 backdrop-blur-sm border border-border/50 rounded-3xl overflow-hidden shadow-lg">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500"></div>
                <Achievements />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}