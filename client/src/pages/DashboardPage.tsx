import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, Trophy, Sparkles, ChevronRight, LogOut, Menu, X, Settings } from 'lucide-react';
import { SafeThemeToggle } from '@/components/SafeThemeToggle';
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
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-6">
              <Logo size={32} />
              <h1 className="text-xl font-bold">Кармічний щоденник</h1>
              
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={() => setLocation("/dashboard")}
                  className="flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Дашборд
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setLocation("/analytics")}
                  className="flex items-center gap-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  Аналітика
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setLocation("/subscriptions")}
                  className="flex items-center gap-2"
                >
                  <Trophy className="w-4 h-4" />
                  Підписки
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setLocation("/settings")}
                  className="flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Налаштування
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback>
                    {user.firstName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{user.firstName}</span>
              </div>
              <SafeThemeToggle />
              <Button variant="ghost" size="sm" onClick={handleLogout} className="hidden md:flex">
                <LogOut className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t">
            <div className="container px-4 py-2 space-y-1">
              <Button variant="ghost" className="w-full justify-start" onClick={() => setLocation("/dashboard")}>
                <Sparkles className="w-4 h-4 mr-2" />
                Дашборд
              </Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => setLocation("/analytics")}>
                <TrendingUp className="w-4 h-4 mr-2" />
                Аналітика
              </Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => setLocation("/subscriptions")}>
                <Trophy className="w-4 h-4 mr-2" />
                Підписки
              </Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => setLocation("/settings")}>
                <Settings className="w-4 h-4 mr-2" />
                Налаштування
              </Button>
              <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Вихід
              </Button>
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
      <div className="container max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{getGreeting()}</h1>
          <p className="text-muted-foreground">{getMotivationalQuote()}</p>
        </div>

        

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Огляд
            </TabsTrigger>
            <TabsTrigger value="ai-chat" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              AI-чат
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Аналітика
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Досягнення
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Quick Add Journal Entry */}
              <JournalQuickAdd onSuccess={() => {
                toast({
                  title: "Успіх",
                  description: "Запис додано до щоденника"
                });
                queryClient.invalidateQueries({ queryKey: ["user"] });
              }} />

              {/* Today's Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Прогрес дня</CardTitle>
                  <CardDescription>Ваші досягнення сьогодні</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Позитивні дії</span>
                      <span>{Math.min(5, user?.stats?.totalEntries || 0)}/5</span>
                    </div>
                    <Progress value={Math.min(100, ((user?.stats?.totalEntries || 0) / 5) * 100)} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Настрій</span>
                      <span>{(user?.stats?.averageMood || 0).toFixed(1)}/10</span>
                    </div>
                    <Progress value={(user?.stats?.averageMood || 0) * 10} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main dashboard content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <TodaysPlan />
                
                {user && principles && (
                  <NextPrincipleCard 
                    currentPrinciple={user.currentPrinciple}
                    principles={principles}
                  />
                )}
                
                <AIDailyInsight principleId={user?.currentPrinciple || 1} />
              </div>

              <div className="lg:col-span-1 space-y-6">

                <AIBudgetStatus />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ai-chat">
            <AIChat />
          </TabsContent>

          <TabsContent value="analytics">
            <KarmaStats />
          </TabsContent>

          <TabsContent value="achievements">
            <Achievements />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}