import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { authUtils } from '@/utils/auth';
import { apiRequest } from '@/lib/apiRequest';
import { useToast } from '@/hooks/use-toast';

interface GoogleLoginButtonProps {
  onAuthSuccess?: () => void;
}

export default function GoogleLoginButton({ onAuthSuccess }: GoogleLoginButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Check if Google OAuth is configured
  const hasGoogleOAuth = import.meta.env.VITE_GOOGLE_CLIENT_ID && 
                        import.meta.env.VITE_GOOGLE_CLIENT_ID.length > 20;

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      console.log('Google login successful:', credentialResponse);
      
      if (!credentialResponse.credential) {
        throw new Error('No credential received from Google');
      }
      
      const data = await apiRequest('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({
          idToken: credentialResponse.credential
        }),
      });
      
      // Save auth data
      authUtils.setToken(data.token);
      authUtils.setUser(data.user);
      
      // Clear any cached data
      queryClient.clear();
      
      toast({
        title: data.isNewUser ? "Ласкаво просимо!" : "З поверненням!",
        description: data.isNewUser 
          ? "Акаунт створено успішно" 
          : "Ви успішно увійшли",
      });

      if (onAuthSuccess) {
        onAuthSuccess();
      } else {
        // Определить следующий шаг в потоке пользователя
        if (data.needsSubscription || data.isNewUser) {
          setLocation('/subscriptions');
        } else if (!data.user.hasCompletedOnboarding) {
          setLocation('/onboarding');
        } else {
          setLocation('/dashboard');
        }
      }
    } catch (error) {
      console.error('Google authentication error:', error);
      toast({
        title: "Помилка входу",
        description: error instanceof Error ? error.message : "Спробуйте ще раз",
        variant: "destructive",
      });
    }
  };

  const handleGoogleError = () => {
    console.error('Google login failed');
    toast({
      title: "Помилка Google входу",
      description: "Не вдалося увійти через Google",
      variant: "destructive",
    });
  };

  // Show fallback if Google OAuth is not configured
  if (!hasGoogleOAuth) {
    return (
      <div className="w-full p-3 border border-gray-300 rounded-md text-center text-gray-500">
        Google OAuth не налаштовано
      </div>
    );
  }

  return (
    <div className="w-full">
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        useOneTap={false}
        auto_select={false}
        theme="outline"
        size="large"
        width="100%"
        locale="uk"
      />
    </div>
  );
}