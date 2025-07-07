import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { authUtils } from '@/utils/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!authUtils.isAuthenticated()) {
      setLocation('/login');
    }
  }, [setLocation]);

  if (!authUtils.isAuthenticated()) {
    return null; // Will redirect to login
  }

  return <>{children}</>;
}