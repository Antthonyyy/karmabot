import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import GoogleLoginButton from "@/components/GoogleLoginButton";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { authUtils } from '@/utils/auth';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Logo, LogoWithText } from '@/components/Logo';
import { useUserState } from '@/hooks/useUserState';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function HomePage() {
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { t } = useTranslation('common');
  const { user, nextStep, isLoading } = useUserState();

  useEffect(() => {
    // Check if user is already authenticated
    if (authUtils.isAuthenticated()) {
      if (nextStep === 'dashboard') {
        setLocation("/dashboard");
      } else if (nextStep === 'onboarding') {
        setLocation("/onboarding");
      } else if (nextStep === 'subscription') {
        setLocation("/subscriptions");
      }
    }
  }, [nextStep, setLocation]);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    // UserFlowManager will handle the redirect
  };

  if (isAuthenticated || isLoading) {
    return <LoadingSpinner size="lg" className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <LogoWithText />
          <LanguageSwitcher />
        </div>

        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Кармічний Щоденник
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Відстежуйте свої добрі справи та розвивайте карму
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="p-6">
              <CardContent className="text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Записуйте справи</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Відстежуйте свої добрі вчинки та духовний розвиток
                </p>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardContent className="text-center">
                <CheckCircle className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Аналізуйте прогрес</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Дивіться статистику та досягнення
                </p>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardContent className="text-center">
                <CheckCircle className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Отримуйте поради</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  AI-асистент допоможе у вашому розвитку
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="max-w-md mx-auto">
            <GoogleLoginButton onAuthSuccess={handleAuthSuccess} />
          </div>
        </div>
      </div>
    </div>
  );
}
