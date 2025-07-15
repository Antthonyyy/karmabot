import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { apiRequest } from '@/lib/apiRequest';
import { useToast } from "@/hooks/use-toast";
import VideoInstructionModal from "./VideoInstructionModal";

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export default function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [showVideoInstruction, setShowVideoInstruction] = useState(false);

  const completeOnboardingMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/user/onboarding/complete", { 
        method: "PATCH" 
      });
      return response.json();
    },
    onSuccess: () => {
      console.log('Onboarding completion successful');
      onComplete();
      // Show video instruction immediately after onboarding
      setShowVideoInstruction(true);
      queryClient.invalidateQueries({ queryKey: ["/api/user/me"] });
    },
    onError: (error) => {
      console.error("Error completing onboarding:", error);
      // Allow user to proceed even if tracking fails
      onComplete();
      setShowVideoInstruction(true);
    },
  });

  const handleNext = () => {
    console.log('Starting onboarding completion...');
    completeOnboardingMutation.mutate();
  };

  const handleVideoComplete = () => {
    console.log('Navigating to dashboard...');
    setShowVideoInstruction(false);
    setLocation("/dashboard");
    toast({
      title: "Вітаємо!",
      description: "Тепер ви знаєте, як користуватися додатком. Приємної практики!",
    });
  };

  return (
    <>
      <Dialog open={isOpen && !showVideoInstruction} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[650px] p-8">
          <div className="text-center space-y-6">
            <div>
              <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Ласкаво просимо до карма-щоденника! 
              </DialogTitle>
              <DialogDescription className="text-lg text-muted-foreground mt-4">
                Ваша подорож духовного розвитку починається зараз
              </DialogDescription>
            </div>

            <div className="space-y-4">
              <div className="text-left">
                <h3 className="text-xl font-semibold mb-3">🎯 Що вас чекає:</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    10 принципів карми для покращення життя
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Щоденні рефлексії та ведення щоденника
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    ШІ-помічник для персональних порад
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Аналітика вашого прогресу
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    Нагадування в Telegram боті
                  </li>
                </ul>
              </div>

              <div className="text-left">
                <h3 className="text-xl font-semibold mb-3">📖 Інструкція користування</h3>
                <div className="w-full h-72 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <iframe
                    width="100%"
                    height="100%"
                    src="https://www.youtube.com/embed/Q-uWeyHzkbI"
                    title="Інструкція користування карма-щоденником"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    onLoad={() => setIsVideoLoaded(true)}
                    style={{ border: 'none' }}
                  />
                </div>
              </div>
            </div>

            {/* Next Button */}
            <div className="flex justify-center">
              <Button
                size="lg"
                className="px-12 py-3 text-lg font-semibold w-full md:w-auto"
                onClick={handleNext}
                disabled={completeOnboardingMutation.isPending}
              >
                {completeOnboardingMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Збереження...
                  </>
                ) : (
                  "Далі"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Video instruction modal after onboarding */}
      {showVideoInstruction && (
        <VideoInstructionModal
          isOpen={showVideoInstruction}
          onClose={handleVideoComplete}
          title="📖 Інструкція користування додатком"
          description="Дізнайтеся, як максимально ефективно використовувати ваш карма-щоденник для духовного розвитку"
          videoId="Q-uWeyHzkbI"
        />
      )}
    </>
  );
}