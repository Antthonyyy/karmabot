import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Sparkles, HandHeart, Loader2, Plus, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { authUtils } from '@/utils/auth';
import { VoiceRecorder } from './VoiceRecorder';

interface JournalQuickAddProps {
  onSuccess?: () => void;
}

export function JournalQuickAdd({ onSuccess }: JournalQuickAddProps) {
  const { t, i18n } = useTranslation(['journal', 'common']);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState('kindness');
  const [description, setDescription] = useState('');

  const addEntryMutation = useMutation({
    mutationFn: async (data: { category: string; description: string }) => {
      try {
        const res = await fetch('/api/journal/entries', {
          method: 'POST',
          headers: {
            ...authUtils.getAuthHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
        
        // Check if response is JSON
        const contentType = res.headers.get('content-type');
        const isJson = contentType && contentType.includes('application/json');
        
        if (!res.ok) {
          let errorMessage = 'Failed to add entry';
          
          if (isJson) {
            try {
              const error = await res.json();
              errorMessage = error.error || error.message || errorMessage;
            } catch (e) {
              errorMessage = `Server error (${res.status})`;
            }
          } else {
            // Handle non-JSON responses (like HTML error pages)
            const text = await res.text();
            if (text.includes('<!DOCTYPE') || text.includes('<html')) {
              errorMessage = `Server error: Received HTML instead of JSON (${res.status})`;
            } else {
              errorMessage = text || `Server error (${res.status})`;
            }
          }
          
          throw new Error(errorMessage);
        }

        if (!isJson) {
          throw new Error('Server returned non-JSON response');
        }
        
        return res.json();
      } catch (error) {
        // Handle network errors or other issues
        if (error instanceof TypeError && error.message.includes('fetch')) {
          throw new Error('Network error: Unable to connect to server');
        }
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Успіх",
        description: "Запис додано до щоденника"
      });
      setDescription('');
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-today-plan'] });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Помилка",
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const categories = [
    { value: 'kindness', label: 'Доброта', icon: Heart, color: 'text-pink-600' },
    { value: 'gratitude', label: 'Вдячність', icon: Sparkles, color: 'text-purple-600' },
    { value: 'help', label: 'Допомога', icon: HandHeart, color: 'text-blue-600' },
    { value: 'antidote', label: 'Антидот', icon: Shield, color: 'text-green-600' }
  ];

  const handleSubmit = () => {
    if (!description.trim()) {
      toast({
        title: "Помилка",
        description: "Опис не може бути порожнім",
        variant: 'destructive'
      });
      return;
    }

    addEntryMutation.mutate({ category, description });
  };

  const handleVoiceTranscript = (text: string) => {
    // Додати текст до існуючого опису
    setDescription(prev => {
      const newText = prev ? `${prev} ${text}` : text;
      return newText;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Швидкий запис
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup value={category} onValueChange={setCategory}>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Label
                  key={cat.value}
                  htmlFor={cat.value}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    category === cat.value
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-primary/50'
                  }`}
                >
                  <RadioGroupItem value={cat.value} id={cat.value} className="sr-only" />
                  <Icon className={`w-6 h-6 ${cat.color}`} />
                  <span className="text-xs text-center">{cat.label}</span>
                </Label>
              );
            })}
          </div>
        </RadioGroup>

        <div className="space-y-3">
          <Textarea
            placeholder={
              category === 'antidote' 
                ? "Опишіть антидот до негативної думки або дії..."
                : "Опишіть свій добрий вчинок..."
            }
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="resize-none"
          />
          
          <VoiceRecorder 
            onTranscript={handleVoiceTranscript}
            disabled={addEntryMutation.isPending}
            language={i18n.language}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={addEntryMutation.isPending || !description.trim()}
          className="w-full"
        >
          {addEntryMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : category === 'antidote' ? (
            <Shield className="w-4 h-4 mr-2" />
          ) : (
            <Heart className="w-4 h-4 mr-2" />
          )}
          {category === 'antidote' ? 'Додати антидот' : 'Додати запис'}
        </Button>
      </CardContent>
    </Card>
  );
}