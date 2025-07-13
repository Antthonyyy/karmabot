import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { authUtils } from '@/utils/auth';
import { useUserState } from '@/hooks/useUserState';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [location, setLocation] = useLocation();
  const { user, nextStep, isLoading } = useUserState();
  
  useEffect(() => {
    if (!authUtils.isAuthenticated()) {
      setLocation('/login');
      return;
    }
    
    // Only redirect if user is not already on the correct page
    const currentPath = location.substring(1) || 'dashboard'; // Remove leading slash
    if (nextStep !== 'dashboard' && currentPath !== nextStep) {
      setLocation(`/${nextStep}`);
    }
  }, [nextStep, setLocation, location]);
  
  if (!authUtils.isAuthenticated()) {
    return null;
  }
  
  if (isLoading) {
    return <LoadingSpinner size="lg" className="min-h-screen" />;
  }
  
  // Allow rendering if user is on the correct page for their flow step
  const currentPath = location.substring(1) || 'dashboard';
  if (nextStep !== 'dashboard' && currentPath !== nextStep) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}