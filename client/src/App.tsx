import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Router } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import GoogleOAuthProvider from "@/components/GoogleOAuthProvider";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import PageTransition from "@/components/PageTransition";
import ProtectedRoute from "@/components/ProtectedRoute";
import UserFlowManager from "@/components/UserFlowManager";
import { AuthErrorBoundary } from "@/components/AuthErrorBoundary";
import { Suspense, lazy } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";

// Pages - Critical pages loaded immediately
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import ProfilePage from "@/pages/ProfilePage";
import SettingsPage from "@/pages/SettingsPage";
import OnboardingPage from "@/pages/OnboardingPage";
import SubscriptionsPage from "@/pages/SubscriptionsPage";
import NotFoundPage from "@/pages/not-found";

// Heavy pages - Lazy loaded
const AnalyticsPage = lazy(() => import("@/pages/AnalyticsPage"));
const ChatPage = lazy(() => import("@/pages/ChatPage"));
const AchievementsPage = lazy(() => import("@/pages/AchievementsPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false, // Prevent unnecessary refetches
    },
  },
});

// Wrapper for lazy loaded routes
const LazyRoute = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingSpinner size="lg" className="min-h-screen" />}>
    {children}
  </Suspense>
);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider>
        <AuthErrorBoundary>
          <Router>
            <div className="min-h-screen bg-background">
              <PageTransition>
                <Route path="/" component={LoginPage} />
                <Route path="/login" component={LoginPage} />
                <Route path="/onboarding">
                  <ProtectedRoute><OnboardingPage /></ProtectedRoute>
                </Route>
                <Route path="/dashboard">
                  <UserFlowManager>
                    <ProtectedRoute><DashboardPage /></ProtectedRoute>
                  </UserFlowManager>
                </Route>
                <Route path="/analytics">
                  <LazyRoute>
                    <UserFlowManager>
                      <ProtectedRoute><AnalyticsPage /></ProtectedRoute>
                    </UserFlowManager>
                  </LazyRoute>
                </Route>
                <Route path="/profile">
                  <UserFlowManager>
                    <ProtectedRoute><ProfilePage /></ProtectedRoute>
                  </UserFlowManager>
                </Route>
                <Route path="/settings">
                  <UserFlowManager>
                    <ProtectedRoute><SettingsPage /></ProtectedRoute>
                  </UserFlowManager>
                </Route>
                <Route path="/subscriptions">
                  <ProtectedRoute><SubscriptionsPage /></ProtectedRoute>
                </Route>
                <Route path="/achievements">
                  <LazyRoute>
                    <UserFlowManager>
                      <ProtectedRoute><AchievementsPage /></ProtectedRoute>
                    </UserFlowManager>
                  </LazyRoute>
                </Route>
                <Route path="/chat">
                  <LazyRoute>
                    <UserFlowManager>
                      <ProtectedRoute><ChatPage /></ProtectedRoute>
                    </UserFlowManager>
                  </LazyRoute>
                </Route>
                {/* Catch-all route for truly unknown paths */}
                <Route path="*">
                  <NotFoundPage />
                </Route>
              </PageTransition>
            </div>
            <Toaster />
            <PWAInstallPrompt />
          </Router>
        </AuthErrorBoundary>
      </GoogleOAuthProvider>
    </QueryClientProvider>
  );
}
