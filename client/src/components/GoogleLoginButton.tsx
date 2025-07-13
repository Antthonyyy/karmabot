import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { authUtils } from '@/utils/auth';
import { apiRequest } from '@/lib/queryClient';

interface GoogleLoginButtonProps {
  onAuthSuccess?: () => void;
}

export default function GoogleLoginButton({ onAuthSuccess }: GoogleLoginButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

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
        if (data.isNewUser || !data.user.hasCompletedOnboarding) {
          setLocation('/onboarding');
        } else if (data.needsSubscription) {
          setLocation('/subscriptions');
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

  return (
    <div className="w-full">
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        useOneTap
        theme="filled_blue"
        size="large"
        text="continue_with"
        shape="rectangular"
        locale="uk"
      />
    </div>
  );
}