import { authUtils } from '@/utils/auth';
import { useLocation } from 'wouter';
import { useToast } from './use-toast';

export function useAuth() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const logout = () => {
    authUtils.clearAuth();
    setLocation('/');
    toast({
      title: "Вихід виконано",
      description: "До зустрічі!"
    });
  };
  
  return {
    token: authUtils.getToken(),
    user: authUtils.getUser(),
    isAuthenticated: authUtils.isAuthenticated(),
    logout,
    authUtils
  };
}