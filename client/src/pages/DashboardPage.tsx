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
import { User } from "@/lib/types";
import { 
  Home, 
  BookOpen, 
  TrendingUp, 
  Settings, 
  Menu, 
  X,
  LogOut,
  Plus
} from "lucide-react";

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showDiaryForm, setShowDiaryForm] = useState(false);

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem("karma_token");
    if (!token) {
      setLocation("/");
    }
  }, [setLocation]);

  // Fetch user data
  const { data: user, isLoading: userLoading, error: userError } = useQuery<User>({
    queryKey: ["/api/user/me"],
    enabled: !!localStorage.getItem("karma_token"),
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

  const handleLogout = () => {
    localStorage.removeItem("karma_token");
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

  if (userError || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">Помилка завантаження даних користувача</p>
            <Button onClick={() => setLocation("/")}>Повернутися на головну</Button>
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
                onClick={() => setActiveTab("settings")}
                className={activeTab === "settings" ? "text-blue-600" : ""}
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
                  setActiveTab("settings");
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

              {/* Current Principle */}
              {currentPrinciple && (
                <div className="mb-12">
                  <PrincipleCard 
                    principle={currentPrinciple} 
                    isCurrent={true}
                    onOpenDiary={() => setShowDiaryForm(true)}
                  />
                </div>
              )}

              {/* All Principles Grid */}
              {principles && (
                <div className="mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                    10 кармічних принципів
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {principles.map((principle: any) => (
                      <PrincipleCard
                        key={principle.id}
                        principle={principle}
                        isCurrent={principle.number === user.currentPrinciple}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Diary Tab */}
          <TabsContent value="diary" className="py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Ваш щоденник</h2>
                <p className="text-gray-600 text-lg">Записуйте свої роздуми, досвід та відкриття</p>
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
          <TabsContent value="progress" className="py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Ваш прогрес</h2>
                <p className="text-gray-600 text-lg">Відстежуйте свій духовний розвиток</p>
              </div>
              
              <ProgressChart user={user} />
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Налаштування</h2>
                <p className="text-gray-600 text-lg">Персоналізуйте свій досвід використання додатку</p>
              </div>
              
              <SettingsPanel user={user} />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Floating Action Button */}
      <Button
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg"
        onClick={() => setShowDiaryForm(true)}
      >
        <Plus className="w-6 h-6" />
      </Button>

      {/* Diary Form Modal */}
      {showDiaryForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Новий запис у щоденнику</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDiaryForm(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <DiaryForm
                currentPrinciple={currentPrinciple}
                onSuccess={() => {
                  setShowDiaryForm(false);
                  // Refresh data
                  window.location.reload();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
