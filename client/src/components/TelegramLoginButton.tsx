import { useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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

  useEffect(() => {
    // Create script element for Telegram Login Widget
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", "KarmaBot_bot"); // Replace with your bot username
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
      container.appendChild(script);
    }

    return () => {
      // Cleanup
      if (window.onTelegramAuth) {
        delete window.onTelegramAuth;
      }
    };
  }, [onAuthSuccess, toast]);

  return (
    <div id="telegram-login-container" className="flex justify-center">
      {/* Telegram Login Widget will be injected here */}
    </div>
  );
}

// Extend global window interface
declare global {
  interface Window {
    onTelegramAuth: (user: any) => void;
  }
}
