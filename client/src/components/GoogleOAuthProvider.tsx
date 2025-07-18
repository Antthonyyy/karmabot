import { GoogleOAuthProvider as GoogleProvider } from '@react-oauth/google';
import { useEffect, useState } from 'react';

interface GoogleOAuthProviderProps {
  children: React.ReactNode;
}

export default function GoogleOAuthProvider({ children }: GoogleOAuthProviderProps) {
  const [hasClientId, setHasClientId] = useState(false);
  const [clientId, setClientId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Добавляем небольшую задержку для гарантии загрузки window.GOOGLE_CLIENT_ID
    const timer = setTimeout(() => {
      const id = (window as any).GOOGLE_CLIENT_ID || import.meta.env.VITE_GOOGLE_CLIENT_ID;
      
      console.log('🔍 Google OAuth Debug:', {
        windowId: (window as any).GOOGLE_CLIENT_ID,
        envId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        finalId: id,
        isPlaceholder: id === 'YOUR_GOOGLE_CLIENT_ID',
        length: id ? id.length : 0
      });
      
      if (id && id.length > 20 && id !== 'YOUR_GOOGLE_CLIENT_ID') {
        setClientId(id);
        setHasClientId(true);
        console.log('✅ Google Client ID configured');
      } else {
        console.warn('❌ Google Client ID not found or invalid, Google OAuth disabled');
        setHasClientId(false);
      }
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Показываем loading пока проверяем client ID
  if (isLoading) {
    return <>{children}</>;
  }

  // Если client ID недоступен, рендерим children без провайдера
  // но устанавливаем глобальный флаг для компонентов
  if (!hasClientId || !clientId) {
    (window as any).GOOGLE_OAUTH_DISABLED = true;
    return <>{children}</>;
  }
  
  (window as any).GOOGLE_OAUTH_DISABLED = false;

  return (
    <GoogleProvider clientId={clientId}>
      {children}
    </GoogleProvider>
  );
}