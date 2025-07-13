import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useUserState } from '@/hooks/useUserState';
import LoadingSpinner from './LoadingSpinner';

interface UserFlowManagerProps {
  children: React.ReactNode;
}

export function UserFlowManager({ children }: UserFlowManagerProps) {
  const { user, nextStep, isLoading } = useUserState();
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    if (nextStep !== 'dashboard') {
      setLocation(`/${nextStep}`);
    }
  }, [nextStep, setLocation]);
  
  if (isLoading) {
    return <LoadingSpinner size="lg" className="min-h-screen" />;
  }
  
  if (nextStep === 'dashboard') {
    return <>{children}</>;
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="md" className="mx-auto mb-4" />
        <p className="text-muted-foreground">Перенаправление на {nextStep}...</p>
      </div>
    </div>
  );
}

export default UserFlowManager; 