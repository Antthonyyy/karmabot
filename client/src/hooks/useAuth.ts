import { authUtils } from '@/utils/auth';
import { fetchUser } from '@/utils/fetchUser';
import { useLocation } from 'wouter';
import { useToast } from './use-toast';
import { useQuery } from '@tanstack/react-query';

export function useAuth() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Query to fetch current user data
  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ['user'],
    queryFn: fetchUser,
    enabled: authUtils.isAuthenticated(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error?.message?.includes('401')) return false;
      return failureCount < 3;
    }
  });

  const logout = () => {
    authUtils.clearAuth();
    setLocation('/');
    toast({
      title: "Вихід виконано",
      description: "До зустрічі!"
    });
  };

  const refreshUser = () => {
    refetch();
  };

  return {
    token: authUtils.getToken(),
    user,
    isAuthenticated: authUtils.isAuthenticated(),
    isLoading,
    error,
    logout,
    refreshUser
  };
}