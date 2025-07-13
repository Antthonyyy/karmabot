import * as Sentry from "@sentry/react";

// Sentry configuration for client
const initSentry = () => {
  // Only initialize Sentry in production
  if (process.env.NODE_ENV === "production") {
    Sentry.init({
      dsn: process.env.VITE_SENTRY_DSN, // You'll need to add this to your env vars
      environment: process.env.NODE_ENV || "development",
      // Performance monitoring
      tracesSampleRate: 0.1, // 10% of transactions
      // Release tracking
      release: process.env.VITE_APP_VERSION || "unknown",
      // User context
      beforeSend(event, hint) {
        // Don't send events in development
        if (process.env.NODE_ENV === "development") {
          return null;
        }
        return event;
      },
    });

    console.log("📊 Sentry initialized for error tracking and performance monitoring");
  }
};

// Helper function to capture user feedback
export const captureUserFeedback = (message: string, level: 'error' | 'warning' | 'info' = 'info') => {
  if (process.env.NODE_ENV === "production") {
    Sentry.captureMessage(message, level);
  }
};

// Helper function to capture exceptions
export const captureException = (error: Error, context?: any) => {
  if (process.env.NODE_ENV === "production") {
    Sentry.withScope((scope) => {
      if (context) {
        scope.setContext("additional_info", context);
      }
      Sentry.captureException(error);
    });
  }
  // Always log to console in development
  console.error("Error captured:", error, context);
};

// Helper function to set user context
export const setUserContext = (user: {
  id: string;
  email?: string;
  username?: string;
}) => {
  if (process.env.NODE_ENV === "production") {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
    });
  }
};

// Helper function to add breadcrumb
export const addBreadcrumb = (message: string, category: string, level: 'info' | 'warning' | 'error' = 'info') => {
  if (process.env.NODE_ENV === "production") {
    Sentry.addBreadcrumb({
      message,
      category,
      level,
      timestamp: Date.now() / 1000,
    });
  }
};

export default initSentry; 