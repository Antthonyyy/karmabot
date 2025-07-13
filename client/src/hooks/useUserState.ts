import { useQuery } from '@tanstack/react-query';
import { authUtils } from '@/utils/auth';
import { apiRequest } from '@/lib/apiRequest';

export function useUserState() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', 'state'],
    queryFn: () => apiRequest('/api/user/me'),
    enabled: authUtils.isAuthenticated(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error?.message?.includes('401')) return false;
      return failureCount < 3;
    }
  });
  
  const determineUserFlow = () => {
    if (!user) return 'login';
    if (!user.hasCompletedOnboarding) return 'onboarding';
    if (user.subscription === 'none') return 'subscription';
    return 'dashboard';
  };
  
  return { 
    user, 
    nextStep: determineUserFlow(),
    isLoading,
    error
  };
} 