import { GoogleOAuthProvider as GoogleProvider } from '@react-oauth/google';
import { useEffect, useState } from 'react';

interface GoogleOAuthProviderProps {
  children: React.ReactNode;
}

export default function GoogleOAuthProvider({ children }: GoogleOAuthProviderProps) {
  const [hasClientId, setHasClientId] = useState(false);
  const [clientId, setClientId] = useState<string>('');
  
  useEffect(() => {
    // Получаем client ID из window или env
    const id = (window as any).GOOGLE_CLIENT_ID || import.meta.env.VITE_GOOGLE_CLIENT_ID;
    
    if (id && id.length > 20 && id !== 'YOUR_GOOGLE_CLIENT_ID') {
      setClientId(id);
      setHasClientId(true);
      console.log('✅ Google Client ID configured');
    } else {
      console.warn('❌ Google Client ID not found or invalid, Google OAuth disabled');
      setHasClientId(false);
    }
  }, []);

  // Если client ID недоступен, рендерим children без провайдера
  if (!hasClientId || !clientId) {
    return <>{children}</>;
  }

  return (
    <GoogleProvider clientId={clientId}>
      {children}
    </GoogleProvider>
  );
}