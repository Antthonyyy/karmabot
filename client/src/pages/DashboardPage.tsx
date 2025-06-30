import { useQuery } from '@tanstack/react-query';
import { useLocation } from "wouter";
import EntryFab from '@/components/EntryFab';
import StreakCard from '@/components/StreakCard';
import NextPrincipleCard from "@/components/NextPrincipleCard";
import ProgressChart from '@/components/ProgressChart';
import TodaysPlan from "@/components/TodaysPlan";
import LatestEntries from "@/components/LatestEntries";
import OnboardingModal from "@/components/OnboardingModal";
import WelcomeHero from "@/components/WelcomeHero";
import { useOnboarding } from "@/hooks/useOnboarding";
import { authUtils } from '@/utils/auth';

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { showOnboarding, completeOnboarding } = useOnboarding();

  // Check authentication once
  const token = authUtils.getToken();
  if (!token) {
    setLocation("/");
    return null;
  }

  // Fetch user data
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["/api/user/me"],
    queryFn: async () => {
      const res = await fetch("/api/user/me", {
        headers: authUtils.getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch user');
      return res.json();
    },
  });

  // Loading state
  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  // Not authenticated state
  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6 pt-4 md:pt-16 pb-24 px-4 max-w-5xl mx-auto">
      {/* Hero блок приветствия */}
      <WelcomeHero user={user} streak={user?.stats?.streakDays ?? 0} openModal={() => {}} />

      {/* 1-я строка */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <StreakCard />
        <NextPrincipleCard />
      </div>

      {/* мини-график настроения */}
      <ProgressChart />

      {/* Today's reminders */}
      <TodaysPlan />

      {/* последние 3 записи */}
      <LatestEntries />

      {/* Entry FAB */}
      <EntryFab />

      {/* Onboarding Modal */}
      {showOnboarding && (
        <OnboardingModal onComplete={completeOnboarding} />
      )}
    </div>
  );
}