import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play, X } from "lucide-react";

interface VideoInstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  videoId: string;
}

export default function VideoInstructionModal({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  videoId 
}: VideoInstructionModalProps) {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">{description}</DialogDescription>
        
        <div className="relative">
          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 z-10 bg-black/20 hover:bg-black/40 text-white rounded-full h-8 w-8 p-0"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Header */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {title}
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {description}
            </p>
          </div>

          {/* Video Container */}
          <div className="p-6">
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
                src={`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&controls=1`}
                title={title}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}