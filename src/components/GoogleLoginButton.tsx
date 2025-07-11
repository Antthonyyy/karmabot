import { GoogleLogin } from '@react-oauth/google';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { setToken, setUser } from '@/utils/auth';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';

interface GoogleLoginButtonProps {
  onSuccess?: () => void;
}

export default function GoogleLoginButton({ onSuccess }: GoogleLoginButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      console.log('Google login successful:', credentialResponse);
      
      const response = await apiRequest('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken: credentialResponse.credential
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Authentication failed');
      }

      const data = await response.json();
      
      // Save auth data
      setToken(data.token);
      setUser(data.user);
      
      // Clear any cached data
      queryClient.clear();
      
      toast({
        title: data.isNewUser ? "Ласкаво просимо!" : "З поверненням!",
        description: data.isNewUser 
          ? "Акаунт створено успішно" 
          : "Ви успішно увійшли",
      });

      if (onSuccess) {
        onSuccess();
      } else {
        setLocation('/dashboard');
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
        theme="outline"
        size="large"
        width="100%"
        text="signin_with"
        logo_alignment="left"
      />
    </div>
  );
}