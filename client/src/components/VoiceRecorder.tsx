import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Loader2, Languages, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { authUtils } from '@/utils/auth';
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  language?: string;
}

export function VoiceRecorder({ onTranscript, disabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [showLanguageHint, setShowLanguageHint] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();
  const { i18n, t } = useTranslation();

  // Language options with hints
  const languageOptions = [
    { code: 'uk', name: 'Українська', hint: 'Говоріть українською мовою', flag: '🇺🇦' },
    { code: 'ru', name: 'Русский', hint: 'Говорите на русском языке', flag: '🇷🇺' },
    { code: 'en', name: 'English', hint: 'Speak in English', flag: '🇺🇸' },
  ];

  const getCurrentLanguage = () => {
    return selectedLanguage || i18n.language.slice(0, 2);
  };

  const getCurrentLanguageOption = () => {
    return languageOptions.find(lang => lang.code === getCurrentLanguage()) || languageOptions[0];
  };

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
      setShowLanguageHint(true);
      
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
        setShowLanguageHint(false);
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
        description: `Говоріть ${getCurrentLanguageOption().name.toLowerCase()}`,
      });
    } catch (error) {
      console.error('Microphone access error:', error);
      setShowLanguageHint(false);
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
      const file = new File(audioChunksRef.current, 'voice.webm', { type: 'audio/webm' });
      const fd = new FormData();
      fd.append('audio', file);
      fd.append('language', getCurrentLanguage());

      const token = authUtils.getToken();
      const res = await fetch('/api/audio/transcribe', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'TRANSCRIBE_ERROR');
      
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
    <div className="space-y-3">
      {/* Language Selector */}
      <div className="flex items-center gap-2">
        <Languages className="h-4 w-4 text-muted-foreground" />
        <Select value={getCurrentLanguage()} onValueChange={setSelectedLanguage}>
          <SelectTrigger className="w-40 h-8">
            <SelectValue>
              <div className="flex items-center gap-2">
                <span>{getCurrentLanguageOption().flag}</span>
                <span className="text-sm">{getCurrentLanguageOption().name}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {languageOptions.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                <div className="flex items-center gap-2">
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Voice Recording UI */}
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
      </div>

      {/* Language Hint */}
      {(isRecording || showLanguageHint) && (
        <Card className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {getCurrentLanguageOption().hint}
            </span>
          </div>
        </Card>
      )}

      {/* Recording Status */}
      {isRecording && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          Записую... Говоріть чітко
        </div>
      )}
      
      {isProcessing && (
        <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
          <Loader2 className="w-3 h-3 animate-spin" />
          Розпізнаю мову...
        </div>
      )}
    </div>
  );
}