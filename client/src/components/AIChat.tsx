import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Bot, User, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { authUtils } from '@/utils/auth';
import { SubscriptionRequired } from './SubscriptionRequired';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Check subscription features
  const { data: features } = useQuery({
    queryKey: ['subscription-features'],
    queryFn: async () => {
      const response = await fetch('/api/subscriptions/features', {
        headers: authUtils.getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch features');
      return response.json();
    }
  });

  const chatMutation = useMutation({
    mutationFn: async (messages: { role: string; content: string }[]) => {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: authUtils.getAuthHeaders(),
        body: JSON.stringify({ messages, language: 'uk' })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply,
        timestamp: new Date()
      }]);
    },
    onError: (error: any) => {
      console.error('Chat error:', error);
      
      if (error.message.includes('тарифу Про')) {
        toast({
          title: "Потрібна підписка",
          description: "AI-чат доступний тільки в тарифі Про",
          variant: "destructive"
        });
      } else if (error.message.includes('Ліміт')) {
        toast({
          title: "Ліміт вичерпано",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Помилка",
          description: "Не вдалося надіслати повідомлення",
          variant: "destructive"
        });
      }
    }
  });

  const handleSend = () => {
    if (!input.trim() || chatMutation.isPending) return;

    const userMessage = input.trim();
    setInput('');

    // Add user message
    const newUserMessage: Message = {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMessage]);

    // Send to AI
    const chatMessages = [...messages, newUserMessage].map(m => ({
      role: m.role,
      content: m.content
    }));

    chatMutation.mutate(chatMessages);
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Show subscription required if user doesn't have access
  if (features && !features.aiChat) {
    return (
      <SubscriptionRequired 
        feature="AI-чат"
        requiredPlan="pro"
        description="Спілкуйтеся з AI-консультантом для отримання персоналізованих порад з розвитку карми."
      />
    );
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          AI-консультант з карми
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages */}
        <ScrollArea ref={scrollAreaRef} className="flex-1 px-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
              <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Привіт! Я AI-консультант з кармічного розвитку.</p>
              <p className="text-sm">Задавайте питання про ваш духовний шлях.</p>
            </div>
          )}

          <div className="space-y-4 pb-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-blue-600" />
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-1 opacity-70 ${
                    message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {chatMutation.isPending && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-blue-600" />
              </div>
              <div className="bg-gray-100 rounded-lg px-4 py-2">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Задайте питання про карму..."
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              maxLength={500}
              disabled={chatMutation.isPending}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || chatMutation.isPending}
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          {input.length > 400 && (
            <p className="text-xs text-gray-500 mt-1">
              {input.length}/500 символів
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}