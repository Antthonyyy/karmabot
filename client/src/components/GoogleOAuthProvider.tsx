import { GoogleOAuthProvider as GoogleProvider } from '@react-oauth/google';
import { useEffect, useState } from 'react';

interface GoogleOAuthProviderProps {
  children: React.ReactNode;
}

export default function GoogleOAuthProvider({ children }: GoogleOAuthProviderProps) {
  const [hasClientId, setHasClientId] = useState(false);
  // ИСПРАВЛЕНИЕ: Используем window.GOOGLE_CLIENT_ID вместо переменной окружения
  const clientId = (window as any).GOOGLE_CLIENT_ID || import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (clientId && clientId.length > 20 && clientId !== 'YOUR_GOOGLE_CLIENT_ID') { // Basic validation
      setHasClientId(true);
    } else {
      console.warn('Google Client ID not found or invalid, Google OAuth disabled');
      setHasClientId(false);
    }
  }, [clientId]);

  // Render children without Google provider if no client ID
  if (!hasClientId) {
    return <>{children}</>;
  }

  return (
    <GoogleProvider 
      clientId={clientId}
    >
      {children}
    </GoogleProvider>
  );
}