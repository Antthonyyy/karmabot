import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@/lib/types";

export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/user/me"],
    enabled: !!localStorage.getItem("karma_token"),
  });

  useEffect(() => {
    if (!isLoading && user) {
      const needsOnboarding = !user.hasCompletedOnboarding;
      setShowOnboarding(needsOnboarding);
      setIsReady(true);
    }
  }, [user, isLoading]);

  const completeOnboarding = () => {
    setShowOnboarding(false);
  };

  return {
    showOnboarding,
    completeOnboarding,
    isReady,
    user,
  };
}