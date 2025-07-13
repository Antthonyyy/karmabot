import { GoogleOAuthProvider as GoogleProvider } from '@react-oauth/google';
import { useEffect, useState } from 'react';

interface GoogleOAuthProviderProps {
  children: React.ReactNode;
}

export default function GoogleOAuthProvider({ children }: GoogleOAuthProviderProps) {
  const [hasClientId, setHasClientId] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (clientId && clientId.length > 20) { // Basic validation
      setHasClientId(true);
    } else {
      console.warn('VITE_GOOGLE_CLIENT_ID not found or invalid, Google OAuth disabled');
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