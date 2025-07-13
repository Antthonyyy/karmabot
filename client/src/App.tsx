import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Router } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import GoogleOAuthProvider from "@/components/GoogleOAuthProvider";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import PageTransition from "@/components/PageTransition";
import ProtectedRoute from "@/components/ProtectedRoute";
import UserFlowManager from "@/components/UserFlowManager";
import { AuthErrorBoundary } from "@/components/AuthErrorBoundary";

// Pages
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import ProfilePage from "@/pages/ProfilePage";
import SettingsPage from "@/pages/SettingsPage";
import OnboardingPage from "@/pages/OnboardingPage";
import SubscriptionsPage from "@/pages/SubscriptionsPage";
import ChatPage from "@/pages/ChatPage";
import AchievementsPage from "@/pages/AchievementsPage";
import NotFoundPage from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

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
                  <UserFlowManager>
                    <ProtectedRoute><OnboardingPage /></ProtectedRoute>
                  </UserFlowManager>
                </Route>
                <Route path="/dashboard">
                  <UserFlowManager>
                    <ProtectedRoute><DashboardPage /></ProtectedRoute>
                  </UserFlowManager>
                </Route>
                <Route path="/analytics">
                  <UserFlowManager>
                    <ProtectedRoute><AnalyticsPage /></ProtectedRoute>
                  </UserFlowManager>
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
                  <UserFlowManager>
                    <ProtectedRoute><AchievementsPage /></ProtectedRoute>
                  </UserFlowManager>
                </Route>
                <Route path="/chat">
                  <UserFlowManager>
                    <ProtectedRoute><ChatPage /></ProtectedRoute>
                  </UserFlowManager>
                </Route>
                <Route>
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
