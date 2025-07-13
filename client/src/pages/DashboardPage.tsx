import { useQuery } from '@tanstack/react-query';
import { useLocation } from "wouter";
import { useEffect } from 'react';
import EntryFab from '@/components/EntryFab';
import StreakCard from '@/components/StreakCard';
import NextPrincipleCard from "@/components/NextPrincipleCard";
import ProgressChart from '@/components/ProgressChart';
import TodaysPlan from "@/components/TodaysPlan";
import LatestEntries from "@/components/LatestEntries";
import OnboardingModal from "@/components/OnboardingModal";
import WelcomeHero from "@/components/WelcomeHero";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useToast } from '@/hooks/use-toast';
import UsageLimitsDisplay from "@/components/UsageLimitsDisplay";
import { useUserState } from '@/hooks/useUserState';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { showOnboarding, completeOnboarding } = useOnboarding();
  const { toast } = useToast();
  const { user, isLoading: userLoading } = useUserState();

  const { data: subscription } = useQuery({
    queryKey: ['current-subscription'],
    queryFn: async () => {
      const response = await apiRequest('/api/subscriptions/current', { method: 'GET' });
      if (!response.ok) throw new Error('Failed to fetch subscription');
      return response.json();
    }
  });

  useEffect(() => {
    if (subscription?.plan === 'trial' && subscription?.expiresAt) {
      const now = new Date();
      const expires = new Date(subscription.expiresAt);
      const diffTime = expires.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 0 && diffDays <= 3) {
        const dayText = diffDays === 1 ? 'день' : diffDays < 5 ? 'дні' : 'днів';
        toast({
          title: "Пробний період",
          description: `До кінця пробного періоду ${diffDays} ${dayText}`,
        });
      }
    }
  }, [subscription, toast]);

  if (userLoading) {
    return <LoadingSpinner size="lg" className="min-h-screen" />;
  }

  if (!user) return null;

  return (
    <div className="space-y-6 md:mt-14 pt-4 md:pt-16 pb-24 px-4 max-w-5xl mx-auto">
      <WelcomeHero user={user} streak={user?.stats?.streakDays ?? 0} openModal={() => {}} />

      {/* Показываем лимиты */}
      <UsageLimitsDisplay feature="ai_requests" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <StreakCard />
        <NextPrincipleCard />
      </div>

      <ProgressChart />
      <TodaysPlan />
      <LatestEntries />
      <EntryFab />

      {showOnboarding && (
        <OnboardingModal isOpen={showOnboarding} onComplete={completeOnboarding} />
      )}
    </div>
  );
}
