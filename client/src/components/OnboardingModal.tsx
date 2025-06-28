import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export default function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  const completeOnboardingMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", "/api/user/onboarding/complete", {});
      return response.json();
    },
    onSuccess: () => {
      onComplete();
      setLocation("/settings");
      toast({
        title: "Вітаємо!",
        description: "Тепер налаштуйте нагадування для максимальної ефективності.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/me"] });
    },
    onError: (error) => {
      console.error("Error completing onboarding:", error);
      // Allow user to proceed even if tracking fails
      onComplete();
      setLocation("/settings");
      toast({
        title: "Налаштування",
        description: "Налаштуйте нагадування для початку практики.",
      });
    },
  });

  const handleNext = () => {
    completeOnboardingMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-5xl max-h-[90vh] overflow-y-auto p-0 [&>button]:hidden"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        aria-describedby="onboarding-description"
      >
        <DialogTitle className="sr-only">Інструкція користування додатком</DialogTitle>
        <DialogDescription id="onboarding-description" className="sr-only">
          Навчальне відео про використання карма-щоденника
        </DialogDescription>
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            📖 Інструкція користування додатком
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
            Дізнайтеся, як максимально ефективно використовувати ваш карма-щоденник
          </p>
          
          {/* Video Container */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
              {!isVideoLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Завантаження відео...</p>
                  </div>
                </div>
              )}
              <iframe
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0&rel=0&controls=1"
                title="Інструкція користування карма-щоденником"
                frameBorder="0"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
                onLoad={() => setIsVideoLoaded(true)}
                onError={() => {
                  setIsVideoLoaded(true);
                  console.error("Video failed to load");
                }}
                style={{ border: 'none' }}
              />
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
  );
}