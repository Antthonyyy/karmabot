import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import HomePage from "@/pages/HomePage";
import DashboardPage from "@/pages/DashboardPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import SettingsPage from "@/pages/SettingsPage";
import OnboardingPage from "@/pages/OnboardingPage";
import SubscriptionsPage from "@/pages/SubscriptionsPage";
import NotFound from "@/pages/not-found";
import { EmergencyLogout } from "@/components/EmergencyLogout";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/analytics" component={AnalyticsPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/subscriptions" component={SubscriptionsPage} />
      <Route path="/onboarding" component={OnboardingPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <>
      <Toaster />
      <Router />
      <EmergencyLogout />
    </>
  );
}

export default App;