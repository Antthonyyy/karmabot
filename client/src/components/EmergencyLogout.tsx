import { Button } from '@/components/ui/button';
import { authUtils } from '@/utils/auth';
import { LogOut } from 'lucide-react';

export function EmergencyLogout() {
  const handleLogout = () => {
    authUtils.clearAuth();
    window.location.href = '/';
  };

  return (
    <Button 
      onClick={handleLogout}
      variant="ghost"
      size="sm"
      className="fixed bottom-4 right-4 opacity-50 hover:opacity-100 z-50"
    >
      <LogOut className="w-4 h-4 mr-2" />
      Вийти
    </Button>
  );
}