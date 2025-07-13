import React from 'react';
import { useLocation } from 'wouter';
import { authUtils } from '@/utils/auth';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface AuthErrorBoundaryProps {
  children: React.ReactNode;
}

interface AuthErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class AuthErrorBoundary extends React.Component<AuthErrorBoundaryProps, AuthErrorBoundaryState> {
  constructor(props: AuthErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): AuthErrorBoundaryState {
    // Проверяем, является ли ошибка связанной с авторизацией
    if (error.message.includes('401') || error.message.includes('Authentication')) {
      return { hasError: true, error };
    }
    return { hasError: false };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Auth error caught:', error, errorInfo);
    
    // Если ошибка связана с авторизацией, очищаем данные
    if (error.message.includes('401') || error.message.includes('Authentication')) {
      authUtils.clearAuth();
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  handleLogout = () => {
    authUtils.clearAuth();
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Помилка авторизації
            </h2>
            <p className="text-gray-600 mb-6">
              Виникла проблема з вашою сесією. Спробуйте увійти знову.
            </p>
            <div className="space-y-3">
              <Button onClick={this.handleRetry} className="w-full">
                Спробувати знову
              </Button>
              <Button 
                onClick={this.handleLogout} 
                variant="outline" 
                className="w-full"
              >
                Увійти знову
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
} 