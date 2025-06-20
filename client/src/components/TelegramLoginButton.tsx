import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface TelegramLoginButtonProps {
  onAuthSuccess: () => void;
}

declare global {
  interface Window {
    TelegramLoginWidget: {
      dataOnauth: (user: any) => void;
    };
  }
}

export default function TelegramLoginButton({ onAuthSuccess }: TelegramLoginButtonProps) {
  const { toast } = useToast();
  const [botUsername, setBotUsername] = useState<string | null>(null);
  const [showFallback, setShowFallback] = useState(false);

  // Get bot username from backend
  useEffect(() => {
    async function getBotInfo() {
      try {
        const response = await fetch('/api/bot/info');
        if (response.ok) {
          const data = await response.json();
          setBotUsername(data.username);
        } else {
          // Fallback to known bot username
          setBotUsername('karmics_diary_bot');
        }
      } catch (error) {
        console.log('Could not get bot info, using fallback');
        // Fallback to known bot username
        setBotUsername('karmics_diary_bot');
      }
    }
    
    getBotInfo();
  }, []);

  useEffect(() => {
    if (!botUsername) return;

    // Create script element for Telegram Login Widget
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "8");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.setAttribute("data-request-access", "write");
    script.async = true;

    // Add global callback function
    window.onTelegramAuth = async (user: any) => {
      try {
        const response = await apiRequest("POST", "/api/auth/telegram/callback", user);
        const data = await response.json();
        
        // Store token and user data
        localStorage.setItem("karma_token", data.token);
        localStorage.setItem("karma_user", JSON.stringify(data.user));
        
        toast({
          title: "Успішна авторизація!",
          description: data.isNewUser ? "Ласкаво просимо до Кармічного щоденника!" : "З поверненням!",
        });
        
        onAuthSuccess();
      } catch (error) {
        console.error("Auth error:", error);
        toast({
          title: "Помилка авторизації",
          description: "Не вдалося увійти через Telegram. Спробуйте ще раз.",
          variant: "destructive",
        });
      }
    };

    // Find the container and append script
    const container = document.getElementById("telegram-login-container");
    if (container) {
      container.innerHTML = ''; // Clear previous content
      container.appendChild(script);
    }

    // Show fallback after 3 seconds if widget doesn't load
    const fallbackTimer = setTimeout(() => {
      setShowFallback(true);
    }, 3000);

    return () => {
      clearTimeout(fallbackTimer);
      // Cleanup
      if (window.onTelegramAuth) {
        delete window.onTelegramAuth;
      }
    };
  }, [botUsername, onAuthSuccess, toast]);

  const handleManualAuth = () => {
    toast({
      title: "Інструкції для входу",
      description: "Будь ласка, створіть бота в @BotFather та надайте токен розробнику для налаштування автентифікації.",
    });
  };

  if (!botUsername) {
    return (
      <div className="flex justify-center">
        <div className="animate-pulse bg-blue-100 rounded-lg px-6 py-3">
          <span className="text-blue-600">Завантаження...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <div id="telegram-login-container">
        {/* Telegram Login Widget will be injected here */}
      </div>
    </div>
  );
}

// Extend global window interface
declare global {
  interface Window {
    onTelegramAuth: (user: any) => void;
  }
}
