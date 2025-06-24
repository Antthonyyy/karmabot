import { useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BackButton({ to = '/dashboard' }: { to?: string }) {
  const [, setLocation] = useLocation();
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLocation(to)}
      className="mb-4"
    >
      <ArrowLeft className="w-4 h-4 mr-2" />
      Назад
    </Button>
  );
}