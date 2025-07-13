import * as Sentry from "@sentry/node";

// Sentry configuration for server
const initSentry = () => {
  // Only initialize Sentry in production
  if (process.env.NODE_ENV === "production") {
    Sentry.init({
      dsn: process.env.SENTRY_DSN, // You'll need to add this to your env vars
      environment: process.env.NODE_ENV || "development",
      // Performance monitoring
      tracesSampleRate: 0.1, // 10% of transactions
      // Release tracking
      release: process.env.APP_VERSION || "unknown",
      // Server context
      serverName: process.env.SERVER_NAME || "karma-server",
      beforeSend(event, hint) {
        // Don't send events in development
        if (process.env.NODE_ENV === "development") {
          return null;
        }
        return event;
      },
    });

    console.log("📊 Sentry initialized for server error tracking");
  }
};

// Helper function to capture server exceptions
export const captureServerException = (error: Error, context?: any) => {
  if (process.env.NODE_ENV === "production") {
    Sentry.withScope((scope) => {
      if (context) {
        scope.setContext("server_context", context);
      }
      Sentry.captureException(error);
    });
  }
  // Always log to console
  console.error("Server error captured:", error, context);
};

// Helper function to capture server messages
export const captureServerMessage = (message: string, level: 'error' | 'warning' | 'info' = 'info') => {
  if (process.env.NODE_ENV === "production") {
    Sentry.captureMessage(message, level);
  }
  console.log(`[${level.toUpperCase()}] ${message}`);
};

// Helper function to set server context
export const setServerContext = (context: Record<string, any>) => {
  if (process.env.NODE_ENV === "production") {
    Sentry.setContext("server_info", context);
  }
};

// Sentry error handler middleware for Express
export const sentryErrorHandler = () => {
  return Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Capture all errors in production
      return process.env.NODE_ENV === "production";
    },
  });
};

// Sentry request handler middleware for Express
export const sentryRequestHandler = () => {
  return Sentry.Handlers.requestHandler({
    // Include user information in the scope
    user: ['id', 'email', 'username'],
    // Include request information
    request: ['headers', 'method', 'query_string', 'url'],
    // Include IP address
    ip: true,
  });
};

export default initSentry; 