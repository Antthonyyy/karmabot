import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Square } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export function VoiceRecorder({ onTranscript, disabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if Web Speech API is supported
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true);
      
      // Initialize SpeechRecognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'uk-UA'; // Ukrainian language
      
      recognition.onstart = () => {
        setIsRecording(true);
      };
      
      recognition.onend = () => {
        setIsRecording(false);
      };
      
      recognition.onresult = (event) => {
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          onTranscript(finalTranscript);
        }
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        
        let errorMessage = 'Помилка розпізнавання голосу';
        switch (event.error) {
          case 'not-allowed':
            errorMessage = 'Доступ до мікрофона заборонено';
            break;
          case 'no-speech':
            errorMessage = 'Мова не розпізнана';
            break;
          case 'network':
            errorMessage = 'Помилка мережі';
            break;
        }
        
        toast({
          title: "Помилка запису",
          description: errorMessage,
          variant: "destructive",
        });
      };
      
      recognitionRef.current = recognition;
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTranscript, toast]);

  const startRecording = async () => {
    if (!recognitionRef.current || disabled) return;
    
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      recognitionRef.current.start();
      
      toast({
        title: "Запис розпочато",
        description: "Говоріть у мікрофон",
      });
    } catch (error) {
      console.error('Microphone access error:', error);
      toast({
        title: "Помилка доступу",
        description: "Не вдається отримати доступ до мікрофона",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      toast({
        title: "Запис завершено",
        description: "Текст додано до запису",
      });
    }
  };

  if (!isSupported) {
    return null; // Hide component if not supported
  }

  return (
    <div className="flex items-center gap-2">
      {!isRecording ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={startRecording}
          disabled={disabled}
          className="flex items-center gap-2"
        >
          <Mic className="h-4 w-4" />
          Голосовий запис
        </Button>
      ) : (
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={stopRecording}
          className="flex items-center gap-2 animate-pulse"
        >
          <Square className="h-4 w-4" />
          Зупинити запис
        </Button>
      )}
      
      {isRecording && (
        <div className="flex items-center gap-1 text-sm text-red-500">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          Записую...
        </div>
      )}
    </div>
  );
}

// Add types for Web Speech API if not already declared
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}