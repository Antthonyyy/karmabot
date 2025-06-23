import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import PrincipleCard from "@/components/PrincipleCard";
import DiaryForm from "@/components/DiaryForm";
import ProgressChart from "@/components/ProgressChart";
import SettingsPanel from "@/components/SettingsPanel";
import TodaysPlan from "@/components/TodaysPlan";
import NextPrincipleCard from "@/components/NextPrincipleCard";
import AIDailyInsight from "@/components/AIDailyInsight";
import OnboardingModal from "@/components/OnboardingModal";
import { useOnboarding } from "@/hooks/useOnboarding";
import { AIAdvisor } from "@/components/AIAdvisor";
import { AIChat } from "@/components/AIChat";
import { AIBudgetStatus } from "@/components/AIBudgetStatus";
import { JournalQuickAdd } from "@/components/JournalQuickAdd";
import { KarmaStats } from "@/components/KarmaStats";
import { Achievements } from "@/components/Achievements";
import { User } from "@/lib/types";
import { authUtils } from '@/utils/auth';
import { checkAuthError, handleAuthError } from '@/utils/auth-recovery';
import { 
  Home, 
  BookOpen, 
  TrendingUp, 
  Settings, 
  Menu, 
  X,
  LogOut,
  Plus,
  Compass
} from "lucide-react";

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showDiaryForm, setShowDiaryForm] = useState(false);
  
  // Onboarding state
  const { showOnboarding, completeOnboarding, isReady } = useOnboarding();

  // Check authentication
  useEffect(() => {
    if (!authUtils.isAuthenticated()) {
      setLocation("/");
    }
  }, [setLocation]);

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
          
          // Проверяем, является ли это ошибкой токена
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
        
        // Проверяем ошибку аутентификации
        if (checkAuthError(error)) {
          handleAuthError();
          return;
        }
        
        throw error;
      }
    },
    retry: false, // Отключаем retry для ошибок аутентификации
    enabled: !!authUtils.getToken(),
  });

  // Fetch principles
  const { data: principles, isLoading: principlesLoading } = useQuery({
    queryKey: ["/api/principles"],
  });

  // Fetch current principle
  const { data: currentPrinciple } = useQuery({
    queryKey: ["/api/principles", user?.currentPrinciple],
    enabled: !!user?.currentPrinciple,
  });

  // Fetch practice state
  const { data: practiceState } = useQuery({
    queryKey: ['/api/user/practice-state'],
    enabled: !!user,
  });

  const handleLogout = () => {
    authUtils.clearAuth();
    setLocation("/");
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

  // Добавь отображение ошибки
  if (userError) {
    return (
      <div className="p-8">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <h2 className="text-red-800 font-semibold mb-2">Помилка завантаження даних</h2>
            <p className="text-red-600">{userError.message}</p>
            <details className="mt-2">
              <summary className="cursor-pointer text-sm text-red-500">Деталі</summary>
              <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto">
                {JSON.stringify(userError, null, 2)}
              </pre>
            </details>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
              variant="outline"
            >
              Перезавантажити
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="text-2xl">🪷</div>
              <span className="text-xl font-bold text-gray-900">Кармічний щоденник</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-6">
              <Button
                variant="ghost"
                onClick={() => setActiveTab("dashboard")}
                className={activeTab === "dashboard" ? "text-blue-600" : ""}
              >
                <Home className="w-4 h-4 mr-2" />
                Головна
              </Button>
              <Button
                variant="ghost"
                onClick={() => setActiveTab("principles")}
                className={activeTab === "principles" ? "text-blue-600" : ""}
              >
                <Compass className="w-4 h-4 mr-2" />
                Принципи
              </Button>
              <Button
                variant="ghost"
                onClick={() => setActiveTab("diary")}
                className={activeTab === "diary" ? "text-blue-600" : ""}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Щоденник
              </Button>
              <Button
                variant="ghost"
                onClick={() => setActiveTab("progress")}
                className={activeTab === "progress" ? "text-blue-600" : ""}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Прогрес
              </Button>
              <Button
                variant="ghost"
                onClick={() => setLocation("/settings")}
              >
                <Settings className="w-4 h-4 mr-2" />
                Налаштування
              </Button>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback>
                    {user.firstName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-gray-900">{user.firstName}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="hidden md:flex"
              >
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
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-4 py-2 space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  setActiveTab("dashboard");
                  setMobileMenuOpen(false);
                }}
              >
                <Home className="w-4 h-4 mr-2" />
                Головна
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  setActiveTab("principles");
                  setMobileMenuOpen(false);
                }}
              >
                <Compass className="w-4 h-4 mr-2" />
                Принципи
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  setActiveTab("diary");
                  setMobileMenuOpen(false);
                }}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Щоденник
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  setActiveTab("progress");
                  setMobileMenuOpen(false);
                }}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Прогрес
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  setLocation("/settings");
                  setMobileMenuOpen(false);
                }}
              >
                <Settings className="w-4 h-4 mr-2" />
                Налаштування
              </Button>
              <hr className="my-2" />
              <Button
                variant="ghost"
                className="w-full justify-start text-red-600"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Вийти
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="pt-16">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Hero Section */}
              <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  Ваша подорож до{" "}
                  <span className="text-blue-600">кармічної гармонії</span>
                </h1>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                  Щодня застосовуйте один з 10 кармічних принципів, ведіть щоденник рефлексій 
                  та отримуйте персоналізовані нагадування для духовного зростання
                </p>
              </div>



              {/* Today's Plan Section */}
              <div className="mb-12">
                <TodaysPlan />
              </div>

              {/* AI Advisor Section */}
              <div className="mb-8 sm:mb-12">
                <AIAdvisor />
              </div>

              
            </div>
          </TabsContent>

          {/* Principles Tab */}
          <TabsContent value="principles" className="py-4 sm:py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-8 sm:mb-12">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                  10 кармічних принципів
                </h2>
                <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
                  Вивчайте та практикуйте універсальні життєві принципи, що ведуть до внутрішньої гармонії та духовного зростання
                </p>
              </div>

              {principles && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {principles.map((principle: any) => (
                    <PrincipleCard
                      key={principle.id}
                      principle={principle}
                      isCurrent={principle.number === user.currentPrinciple}
                      onOpenDiary={() => {
                        // Don't open diary form here - it's handled by TodaysPlan component  
                      }}
                    />
                  ))}
                </div>
              )}

              {!principles && (
                <div className="text-center py-12">
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/3 mx-auto"></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {[...Array(10)].map((_, i) => (
                        <div key={i} className="h-40 sm:h-48 bg-gray-200 rounded-lg"></div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Diary Tab */}
          <TabsContent value="diary" className="py-4 sm:py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">Ваш щоденник</h2>
                <p className="text-gray-600 text-base sm:text-lg">Записуйте свої роздуми, досвід та відкриття</p>
              </div>
              
              <DiaryForm 
                currentPrinciple={currentPrinciple}
                onSuccess={() => {
                  // Refresh diary entries
                  window.location.reload();
                }}
              />
            </div>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="py-4 sm:py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">Ваш прогрес</h2>
                <p className="text-gray-600 text-base sm:text-lg">Відстежуйте свій духовний розвиток</p>
              </div>
              
              <ProgressChart user={user} />
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="py-4 sm:py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">Налаштування</h2>
                <p className="text-gray-600 text-base sm:text-lg">Персоналізуйте свій досвід використання додатку</p>
              </div>
              
              <SettingsPanel user={user} />
              
              {/* Instruction Video Section in Settings */}
              <div className="mt-8 sm:mt-12">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl sm:rounded-2xl p-4 sm:p-8 text-center">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                    📚 Інструкція користування додатком
                  </h2>
                  <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
                    Дізнайтеся, як максимально ефективно використовувати ваш карма-щоденник
                  </p>
                  <div className="max-w-4xl mx-auto">
                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
                      <iframe
                        src="https://www.youtube.com/embed/Q-uWeyHzkbI"
                        title="Інструкція користування карма-щоденником"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full"
                      ></iframe>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Floating Action Button */}
      <Button
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg"
        onClick={() => setShowDiaryForm(true)}
      >
        <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
      </Button>

      {/* Onboarding Modal */}
      {isReady && (
        <OnboardingModal 
          isOpen={showOnboarding}
          onComplete={completeOnboarding}
        />
      )}
    </div>
  );
}
