import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Heart, Zap, HelpCircle, Gift } from 'lucide-react';
import { VoiceRecorder } from './VoiceRecorder';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/apiRequest';

const formSchema = z.object({
  content: z.string().min(10, 'Запис повинен містити принаймні 10 символів'),
  category: z.string().optional(),
  mood: z.string().optional(),
  energyLevel: z.number().min(1).max(10).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ModalEntryFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ModalEntryForm({ isOpen, onClose }: ModalEntryFormProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: '',
      category: '',
      mood: '',
      energyLevel: 5,
    },
  });

  const categories = [
    { id: 'kindness', label: 'Доброта', icon: Heart, color: 'bg-pink-100 text-pink-700' },
    { id: 'gratitude', label: 'Вдячність', icon: Gift, color: 'bg-green-100 text-green-700' },
    { id: 'help', label: 'Допомога', icon: HelpCircle, color: 'bg-blue-100 text-blue-700' },
    { id: 'antidote', label: 'Протиотрута', icon: Zap, color: 'bg-purple-100 text-purple-700' },
  ];

  const createEntryMutation = useMutation({
    mutationFn: async (data: FormData & { category: string }) => {
      return apiRequest('/api/entries', {
        method: 'POST',
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/entries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/stats'] });
      toast({
        title: 'Запис додано',
        description: 'Ваш запис успішно збережено',
      });
      onClose();
      form.reset();
      setSelectedCategory('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Помилка',
        description: error.message || 'Не вдалося додати запис',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: FormData) => {
    if (!selectedCategory) {
      toast({
        title: 'Оберіть категорію',
        description: 'Будь ласка, оберіть категорію для вашого запису',
        variant: 'destructive',
      });
      return;
    }

    createEntryMutation.mutate({
      ...data,
      category: selectedCategory,
    });
  };

  const handleVoiceTranscript = (text: string) => {
    const currentContent = form.getValues('content');
    const newContent = currentContent ? `${currentContent}\n\n${text}` : text;
    form.setValue('content', newContent);
  };

  const handleClose = () => {
    onClose();
    form.reset();
    setSelectedCategory('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Новий запис у щоденнику</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Categories */}
            <div className="space-y-3">
              <FormLabel>Категорія</FormLabel>
              <div className="grid grid-cols-2 gap-3">
                {categories.map((category) => {
                  const IconComponent = category.icon;
                  return (
                    <Card
                      key={category.id}
                      className={`cursor-pointer transition-all duration-200 ${
                        selectedCategory === category.id
                          ? 'ring-2 ring-primary border-primary'
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${category.color}`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{category.label}</span>
                        {selectedCategory === category.id && (
                          <Badge variant="secondary" className="ml-auto">
                            Обрано
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ваш запис</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Textarea
                        {...field}
                        placeholder="Поділіться своїми думками та роздумами..."
                        className="min-h-[120px] resize-none"
                      />
                      <div className="flex justify-end">
                        <VoiceRecorder onTranscript={handleVoiceTranscript} />
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Mood */}
            <FormField
              control={form.control}
              name="mood"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Настрій (необов'язково)</FormLabel>
                  <FormControl>
                    <div className="flex gap-2 flex-wrap">
                      {['😊', '😌', '😐', '😔', '😤'].map((emoji, index) => (
                        <Button
                          key={emoji}
                          type="button"
                          variant={field.value === emoji ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => field.onChange(emoji)}
                        >
                          {emoji}
                        </Button>
                      ))}
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Energy Level */}
            <FormField
              control={form.control}
              name="energyLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Рівень енергії: {field.value}</FormLabel>
                  <FormControl>
                    <Slider
                      value={[field.value || 5]}
                      onValueChange={(value) => field.onChange(value[0])}
                      max={10}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Submit */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Скасувати
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={createEntryMutation.isPending}
              >
                {createEntryMutation.isPending ? 'Збереження...' : 'Зберегти запис'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}