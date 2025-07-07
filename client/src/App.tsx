import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Router } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import GoogleOAuthProvider from "@/components/GoogleOAuthProvider";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import PageTransition from "@/components/PageTransition";
import ProtectedRoute from "@/components/ProtectedRoute";

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
        <Router>
          <div className="min-h-screen bg-background">
            <PageTransition>
              <Route path="/" component={LoginPage} />
              <Route path="/login" component={LoginPage} />
              <Route path="/onboarding">
                <ProtectedRoute><OnboardingPage /></ProtectedRoute>
              </Route>
              <Route path="/dashboard">
                <ProtectedRoute><DashboardPage /></ProtectedRoute>
              </Route>
              <Route path="/analytics">
                <ProtectedRoute><AnalyticsPage /></ProtectedRoute>
              </Route>
              <Route path="/profile">
                <ProtectedRoute><ProfilePage /></ProtectedRoute>
              </Route>
              <Route path="/settings">
                <ProtectedRoute><SettingsPage /></ProtectedRoute>
              </Route>
              <Route path="/subscriptions">
                <ProtectedRoute><SubscriptionsPage /></ProtectedRoute>
              </Route>
              <Route path="/achievements">
                <ProtectedRoute><AchievementsPage /></ProtectedRoute>
              </Route>
              <Route path="/chat">
                <ProtectedRoute><ChatPage /></ProtectedRoute>
              </Route>
              <Route>
                <NotFoundPage />
              </Route>
            </PageTransition>
          </div>
          <Toaster />
          <PWAInstallPrompt />
        </Router>
      </GoogleOAuthProvider>
    </QueryClientProvider>
  );
}
