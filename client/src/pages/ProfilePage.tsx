import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Calendar, 
  Target, 
  Zap, 
  Trophy,
  Star,
  Edit3,
  Save,
  X,
  TrendingUp,
  BookOpen,
  Heart,
  Shield
} from "lucide-react";
import { authUtils } from "@/utils/auth";

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/user/me"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/user/stats"],
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authUtils.getAuthHeaders()
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Failed to update profile");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Успіх",
        description: "Профіль оновлено успішно"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/me"] });
      setIsEditing(false);
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося оновити профіль",
        variant: "destructive"
      });
    }
  });

  const handleEdit = () => {
    setEditData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      username: user?.username || ""
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateProfileMutation.mutate(editData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({});
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName) return "U";
    return `${firstName.charAt(0)}${lastName ? lastName.charAt(0) : ""}`.toUpperCase();
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Не вказано";
    return new Date(date).toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="container mx-auto p-4 max-w-4xl space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Профіль користувача</h1>
          <p className="text-muted-foreground">
            Керуйте особистою інформацією та переглядайте статистику
          </p>
        </div>
      </div>

      {/* Profile Card */}
      <Card className="bg-gradient-to-br from-violet-50/50 via-purple-50/30 to-blue-50/50 dark:from-violet-950/30 dark:via-purple-950/20 dark:to-blue-950/30 backdrop-blur-xl border-gradient shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <User className="h-6 w-6 text-violet-600" />
              Основна інформація
            </CardTitle>
            {!isEditing ? (
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit3 className="h-4 w-4 mr-2" />
                Редагувати
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Скасувати
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSave}
                  disabled={updateProfileMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Зберегти
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-2xl font-bold">
                  {getInitials(user.firstName, user.lastName)}
                </AvatarFallback>
              </Avatar>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                Принцип {user.currentPrinciple || 1}
              </Badge>
            </div>

            {/* Profile Info */}
            <div className="flex-1 space-y-4">
              {!isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Ім'я</Label>
                    <p className="text-lg font-medium">{user.firstName || "Не вказано"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Прізвище</Label>
                    <p className="text-lg font-medium">{user.lastName || "Не вказано"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Username</Label>
                    <p className="text-lg font-medium">@{user.username || "користувач"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Дата реєстрації</Label>
                    <p className="text-lg font-medium">{formatDate(user.createdAt)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Telegram</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant={user.telegramConnected ? "default" : "secondary"}>
                        {user.telegramConnected ? "Підключено" : "Не підключено"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Мова</Label>
                    <p className="text-lg font-medium">
                      {user.language === "uk" ? "Українська" : "Англійська"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Ім'я</Label>
                    <Input
                      id="firstName"
                      value={editData.firstName}
                      onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                      placeholder="Введіть ім'я"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Прізвище</Label>
                    <Input
                      id="lastName"
                      value={editData.lastName}
                      onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                      placeholder="Введіть прізвище"
                    />
                  </div>
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={editData.username}
                      onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                      placeholder="Введіть username"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 dark:from-orange-500/20 dark:to-red-500/20 backdrop-blur-md border-orange-200/50 dark:border-orange-700/50">
          <CardContent className="p-4 text-center">
            <Zap className="h-8 w-8 mx-auto mb-2 text-orange-600 dark:text-orange-400" />
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {user?.stats?.streakDays || 0}
            </div>
            <div className="text-sm text-muted-foreground">Дні поспіль</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 backdrop-blur-md border-blue-200/50 dark:border-blue-700/50">
          <CardContent className="p-4 text-center">
            <BookOpen className="h-8 w-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {user?.stats?.totalEntries || 0}
            </div>
            <div className="text-sm text-muted-foreground">Записів</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20 backdrop-blur-md border-green-200/50 dark:border-green-700/50">
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 mx-auto mb-2 text-green-600 dark:text-green-400" />
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {user?.currentPrinciple || 1}/10
            </div>
            <div className="text-sm text-muted-foreground">Принципи</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 dark:from-yellow-500/20 dark:to-orange-500/20 backdrop-blur-md border-yellow-200/50 dark:border-yellow-700/50">
          <CardContent className="p-4 text-center">
            <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-600 dark:text-yellow-400" />
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {user?.stats?.longestStreak || 0}
            </div>
            <div className="text-sm text-muted-foreground">Рекорд</div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Прогрес
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Поточний цикл</span>
              <Badge variant="secondary">{user?.stats?.currentCycle || 1}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Тижнева ціль</span>
              <span className="text-sm font-medium">{user?.stats?.weeklyGoal || 7} записів</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Місячна ціль</span>
              <span className="text-sm font-medium">{user?.stats?.monthlyGoal || 30} записів</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-600" />
              Самопочуття
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Середній настрій</span>
              <span className="text-sm font-medium">
                {user?.stats?.averageMood ? `${user.stats.averageMood}/10` : "Не вказано"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Середня енергія</span>
              <span className="text-sm font-medium">
                {user?.stats?.averageEnergy ? `${user.stats.averageEnergy}/10` : "Не вказано"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Час рефлексії</span>
              <span className="text-sm font-medium">
                {user?.stats?.totalReflectionTime || 0} хв
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}