import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { authUtils } from '@/utils/auth';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Logo, LogoWithText } from '@/components/Logo';
import GoogleLoginButton from "@/components/GoogleLoginButton";
import { useUserState } from '@/hooks/useUserState';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function LoginPage() {
  const [, setLocation] = useLocation();
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
    // UserFlowManager will handle the redirect
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <LogoWithText />
          <LanguageSwitcher />
        </div>

        <div className="max-w-md mx-auto">
          <Card className="shadow-lg">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Ласкаво просимо</h2>
                <p className="text-gray-600">Увійдіть через Google, щоб розпочати свою духовну подорож</p>
              </div>
              
              <div className="flex justify-center mb-6">
                <GoogleLoginButton onAuthSuccess={handleAuthSuccess} />
              </div>

              <div className="text-center text-sm text-gray-500">
                <p>Авторизуючись, ви погоджуєтесь з нашими</p>
                <a href="#" className="text-blue-600 hover:underline">Умовами використання</a>
                <span> та </span>
                <a href="#" className="text-blue-600 hover:underline">Політикою конфіденційності</a>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-8 shadow-sm">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Що вас чекає:</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>10 кармічних принципів для щоденної практики</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Персоналізовані нагадування в Telegram</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Відстеження прогресу та статистика</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Щоденник для рефлексії та зростання</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}