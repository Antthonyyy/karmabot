import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@/lib/types";
import { authUtils } from '@/utils/auth';

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/user/me"],
    enabled: !!authUtils.getToken(),
  });

  useEffect(() => {
    if (!isLoading && user) {
      const needsOnboarding = !user.hasCompletedOnboarding;
      console.log('Onboarding check:', { 
        userId: user.id, 
        hasCompletedOnboarding: user.hasCompletedOnboarding, 
        needsOnboarding 
      });
      setShowOnboarding(needsOnboarding);
      setIsReady(true);
    }
  }, [user, isLoading]);

  const completeOnboarding = () => {
    console.log('Manually completing onboarding in hook');
    setShowOnboarding(false);
  };

  return {
    showOnboarding,
    completeOnboarding,
    isReady,
    user,
  };
}