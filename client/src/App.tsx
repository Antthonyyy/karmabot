import { Switch, Route, useLocation } from "wouter";
import { AnimatePresence } from "framer-motion";
import { Toaster } from "@/components/ui/toaster";
import { PageTransition } from "@/components/PageTransition";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import MainNav from "@/components/MainNav";
import HomePage from "@/pages/HomePage";
import DashboardPage from "@/pages/DashboardPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import SettingsPage from "@/pages/SettingsPage";
import ProfilePage from "@/pages/ProfilePage";
import OnboardingPage from "@/pages/OnboardingPage";
import SubscriptionsPage from "@/pages/SubscriptionsPage";
import ChatPage from "@/pages/ChatPage";
import AchievementsPage from "@/pages/AchievementsPage";
import NotFound from "@/pages/not-found";


// Wrapper component for animated routes
function AnimatedRoute({ component: Component, ...props }: any) {
  return (
    <PageTransition>
      <Component {...props} />
    </PageTransition>
  );
}

function Router() {
  const [location] = useLocation();
  
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Switch key={location}>
        <Route path="/" component={(props) => <AnimatedRoute component={HomePage} {...props} />} />
        <Route path="/dashboard" component={(props) => <AnimatedRoute component={DashboardPage} {...props} />} />
        <Route path="/chat" component={(props) => <AnimatedRoute component={ChatPage} {...props} />} />
        <Route path="/analytics" component={(props) => <AnimatedRoute component={AnalyticsPage} {...props} />} />
        <Route path="/achievements" component={(props) => <AnimatedRoute component={AchievementsPage} {...props} />} />
        <Route path="/profile" component={(props) => <AnimatedRoute component={ProfilePage} {...props} />} />
        <Route path="/settings" component={(props) => <AnimatedRoute component={SettingsPage} {...props} />} />
        <Route path="/subscriptions" component={(props) => <AnimatedRoute component={SubscriptionsPage} {...props} />} />
        <Route path="/onboarding" component={(props) => <AnimatedRoute component={OnboardingPage} {...props} />} />
        <Route component={(props) => <AnimatedRoute component={NotFound} {...props} />} />
      </Switch>
    </AnimatePresence>
  );
}

function App() {
  return (
    <div className="min-h-screen pt-14 pb-14 md:pb-0 bg-background">
      <MainNav />
      <Router />
      <Toaster />
      <PWAInstallPrompt />
    </div>
  );
}

export default App;