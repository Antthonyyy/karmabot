import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { authUtils } from '@/utils/auth';

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  language?: string;
}

export function VoiceRecorder({ onTranscript, disabled, language = 'uk' }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = async () => {
    if (disabled || isRecording || isProcessing) return;
    
    // Check for MediaRecorder support
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      toast({
        title: "Не підтримується",
        description: "Ваш браузер не підтримує запис аудіо",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      });
      
      // Determine best supported MIME type
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = ''; // Let browser choose
          }
        }
      }
      
      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        
        if (audioChunksRef.current.length > 0) {
          setIsProcessing(true);
          await processAudio();
        }
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      
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
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async () => {
    try {
      // Create audio blob
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      // Convert to FormData
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language', language); // User's preferred language
      
      // Send to OpenAI transcription endpoint
      const response = await fetch('/api/audio/transcribe', {
        method: 'POST',
        headers: {
          ...authUtils.getAuthHeaders(),
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Помилка транскрипції');
      }
      
      const data = await response.json();
      
      if (data.text && data.text.trim()) {
        onTranscript(data.text.trim());
        toast({
          title: "Голос розпізнано",
          description: "Текст додано до запису",
        });
      } else {
        toast({
          title: "Мова не розпізнана",
          description: "Спробуйте говорити чіткіше",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Audio processing error:', error);
      toast({
        title: "Помилка обробки",
        description: "Не вдалося розпізнати мову",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      audioChunksRef.current = [];
    }
  };

  return (
    <div className="flex items-center gap-2">
      {!isRecording && !isProcessing ? (
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
      ) : isRecording ? (
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
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled
          className="flex items-center gap-2"
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          Обробка...
        </Button>
      )}
      
      {isRecording && (
        <div className="flex items-center gap-1 text-sm text-red-500">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          Записую...
        </div>
      )}
      
      {isProcessing && (
        <div className="flex items-center gap-1 text-sm text-blue-500">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          Розпізнаю...
        </div>
      )}
    </div>
  );
}