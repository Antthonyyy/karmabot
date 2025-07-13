import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // Here you would send to error tracking service like Sentry
      console.log('Error would be sent to error tracking service');
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  private handleReportError = () => {
    const errorReport = {
      error: this.state.error?.toString(),
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    };
    
    console.log('Error report:', errorReport);
    // In production, this would send to your error reporting service
    alert('Звіт про помилку створено. Команда розробки буде повідомлена.');
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-slate-900 dark:to-slate-800">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 rounded-full bg-red-100 dark:bg-red-900/20 w-fit">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-xl font-semibold">
                Щось пішло не так
              </CardTitle>
              <CardDescription>
                Сталася неочікувана помилка. Не хвилюйтеся - ваші дані в безпеці.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button 
                  onClick={this.handleReload} 
                  className="w-full"
                  variant="default"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Перезавантажити
                </Button>
                <Button 
                  onClick={this.handleGoHome} 
                  className="w-full"
                  variant="outline"
                >
                  <Home className="w-4 h-4 mr-2" />
                  На головну
                </Button>
              </div>
              
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                    Деталі помилки (розробка)
                  </summary>
                  <div className="mt-2 p-3 bg-muted rounded text-xs overflow-auto max-h-40">
                    <div className="font-medium text-destructive mb-2">
                      {this.state.error?.toString()}
                    </div>
                    <pre className="whitespace-pre-wrap text-muted-foreground">
                      {this.state.error?.stack}
                    </pre>
                  </div>
                </details>
              )}
              
              <Button 
                onClick={this.handleReportError} 
                variant="ghost" 
                size="sm"
                className="w-full text-muted-foreground"
              >
                <Bug className="w-4 h-4 mr-2" />
                Повідомити про помилку
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
} 