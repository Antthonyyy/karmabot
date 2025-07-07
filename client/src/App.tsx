import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Router } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import GoogleOAuthProvider from "@/components/GoogleOAuthProvider";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import PageTransition from "@/components/PageTransition";

// Pages
import HomePage from "@/pages/HomePage";
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
              <Route path="/" component={HomePage} />
              <Route path="/onboarding" component={OnboardingPage} />
              <Route path="/dashboard" component={DashboardPage} />
              <Route path="/analytics" component={AnalyticsPage} />
              <Route path="/profile" component={ProfilePage} />
              <Route path="/settings" component={SettingsPage} />
              <Route path="/subscriptions" component={SubscriptionsPage} />
              <Route path="/achievements" component={AchievementsPage} />
              <Route path="/chat" component={ChatPage} />
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
