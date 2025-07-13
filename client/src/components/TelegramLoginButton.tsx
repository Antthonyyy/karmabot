import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { authUtils } from '@/utils/auth';
import { apiRequest } from '@/lib/apiRequest';

interface TelegramLoginButtonProps {
  onAuthSuccess: () => void;
}

export default function TelegramLoginButton({ onAuthSuccess }: TelegramLoginButtonProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { toast } = useToast();
  const BOT_USERNAME = "karmics_diary_bot";
  
  const handleTelegramLogin = async () => {
    try {
      // Create session
      const response = await apiRequest('/api/auth/telegram/start-session', { method: 'POST' });
      
      if (!response.sessionId) {
        throw new Error("Failed to create session");
      }
      
      setSessionId(response.sessionId);
      
      // Open Telegram
      const telegramUrl = `https://t.me/${BOT_USERNAME}?start=auth_${response.sessionId}`;
      window.open(telegramUrl, '_blank');
      
      // Start checking status
      setIsChecking(true);
      checkAuthStatus(response.sessionId);
      
    } catch (error) {
      console.error("Error starting session:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося розпочати авторизацію. Спробуйте ще раз.",
        variant: "destructive"
      });
    }
  };
  
  const checkAuthStatus = (currentSessionId: string) => {
    let attempts = 0;
    let authSuccess = false; // Flag to track successful auth
    const maxAttempts = 150; // 5 minutes (150 * 2 seconds)
    
    const checkInterval = setInterval(async () => {
      if (authSuccess) return; // Stop if already successful
      
      attempts++;
      
      try {
        const response = await apiRequest(`/api/auth/check-session/${currentSessionId}`, { method: 'GET' });
        
        if (response.authorized && response.token && response.user) {
          // Successful authorization
          authSuccess = true;
          clearInterval(checkInterval);
          setIsChecking(false);
          setSessionId(null);
          
          // Save data using authUtils
          authUtils.setToken(response.token);
          authUtils.setUser(response.user);
          
          toast({
            title: "Успішна авторизація!",
            description: `Ласкаво просимо, ${response.user.firstName}!`,
          });
          
          // Call callback
          onAuthSuccess();
          return;
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
      }
      
      // Stop after maximum attempts only if auth was not successful
      if (attempts >= maxAttempts && !authSuccess) {
        clearInterval(checkInterval);
        setIsChecking(false);
        setSessionId(null);
        
        toast({
          title: "Час вийшов",
          description: "Не вдалося завершити авторизацію. Спробуйте ще раз.",
          variant: "destructive"
        });
      }
    }, 2000); // Check every 2 seconds
  };
  
  return (
    <div className="flex flex-col items-center gap-4">
      <Button 
        onClick={handleTelegramLogin}
        disabled={isChecking}
        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-all"
      >
        {isChecking ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Очікуємо авторизацію...</span>
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            <span>Увійти через Telegram</span>
          </>
        )}
      </Button>
      
      {isChecking && sessionId && (
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            Перейдіть в Telegram і натисніть <strong>START</strong> у боті
          </p>
          <p className="text-xs text-gray-500">
            @{BOT_USERNAME}
          </p>
          <div className="text-xs text-gray-400 font-mono bg-gray-100 p-2 rounded">
            Сесія: {sessionId}
          </div>
        </div>
      )}
    </div>
  );
}