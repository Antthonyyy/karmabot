import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="text-6xl">💫</div>
            <h1 className="text-2xl font-bold text-foreground">
              Щось пішло не так
            </h1>
            <p className="text-muted-foreground">
              Сталася неочікувана помилка. Спробуйте оновити сторінку.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                🔄 Оновити сторінку
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: undefined });
                }}
                className="w-full bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:bg-secondary/90 transition-colors"
              >
                ↩️ Спробувати ще раз
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left text-xs text-muted-foreground bg-muted p-2 rounded">
                <summary className="cursor-pointer">Деталі помилки</summary>
                <pre className="mt-2 whitespace-pre-wrap break-words">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
} 