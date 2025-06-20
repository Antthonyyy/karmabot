import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface TelegramLoginButtonProps {
  onAuthSuccess: () => void;
}

export default function TelegramLoginButton({ onAuthSuccess }: TelegramLoginButtonProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleTelegramLogin = async () => {
    setIsLoading(true);
    
    try {
      // For demo purposes, create a test user
      const mockUser = {
        id: Date.now(),
        first_name: "Користувач",
        username: "demo_user",
        auth_date: Math.floor(Date.now() / 1000),
        hash: "demo_hash_123"
      };

      const response = await apiRequest("POST", "/api/auth/telegram/callback", mockUser);
      const data = await response.json();
      
      localStorage.setItem("karma_token", data.token);
      localStorage.setItem("karma_user", JSON.stringify(data.user));
      
      toast({
        title: "Успішна авторизація!",
        description: "Ласкаво просимо до Кармічного щоденника!",
      });
      
      onAuthSuccess();
    } catch (error) {
      console.error("Auth error:", error);
      toast({
        title: "Помилка авторизації",
        description: "Спробуйте ще раз.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center">
      <Button 
        onClick={handleTelegramLogin}
        disabled={isLoading}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
        <span>{isLoading ? "Завантаження..." : "Увійти через Telegram"}</span>
      </Button>
    </div>
  );
}