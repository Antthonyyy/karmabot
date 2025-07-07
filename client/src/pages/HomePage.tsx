import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import GoogleLoginButton from "@/components/GoogleLoginButton";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { authUtils } from '@/utils/auth';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Logo, LogoWithText } from '@/components/Logo';

export default function HomePage() {
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { t } = useTranslation('common');

  useEffect(() => {
    // Check if user is already authenticated
    if (authUtils.isAuthenticated()) {
      setLocation("/dashboard");
    }
  }, [setLocation]);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setLocation("/dashboard");
  };

  if (isAuthenticated) {
    return null; // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/50 to-blue-50/50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <LogoWithText size={32} showText={false} />
            <LanguageSwitcher />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-16">
        <section className="min-h-screen flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full">
            <div className="text-center mb-8">
              <div className="mb-6 animate-pulse">
                <Logo size={80} className="mx-auto" />
              </div>
              <LogoWithText size={0} showText={true} className="justify-center" />
            </div>

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
        </section>
      </main>
    </div>
  );
}
