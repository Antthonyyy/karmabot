import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { authUtils } from '@/utils/auth';
import { useUserState } from '@/hooks/useUserState';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();
  const { user, nextStep, isLoading } = useUserState();
  
  useEffect(() => {
    if (!authUtils.isAuthenticated()) {
      setLocation('/login');
      return;
    }
    
    // Redirect to appropriate step in user flow
    if (nextStep !== 'dashboard') {
      setLocation(`/${nextStep}`);
    }
  }, [nextStep, setLocation]);
  
  if (!authUtils.isAuthenticated() || nextStep !== 'dashboard') {
    return null;
  }
  
  if (isLoading) {
    return <LoadingSpinner size="lg" className="min-h-screen" />;
  }
  
  return <>{children}</>;
}