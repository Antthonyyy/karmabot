import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Feather } from "lucide-react";

interface DiaryFormProps {
  currentPrinciple?: any;
  onSuccess?: () => void;
}

const moods = ["😊", "😌", "😔", "😤", "😴", "🤔", "😍", "😮"];

export default function DiaryForm({ currentPrinciple, onSuccess }: DiaryFormProps) {
  const [content, setContent] = useState("");
  const [selectedMood, setSelectedMood] = useState("");
  const [energyLevel, setEnergyLevel] = useState([7]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch recent entries
  const { data: recentEntries, isLoading: entriesLoading } = useQuery({
    queryKey: ["/api/journal/entries", { limit: 5 }],
  });

  // Create entry mutation
  const createEntryMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/journal/entries", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Запис збережено!",
        description: "Ваші думки успішно додано до щоденника.",
      });
      setContent("");
      setSelectedMood("");
      setEnergyLevel([7]);
      queryClient.invalidateQueries({ queryKey: ["/api/journal/entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/me"] });
      onSuccess?.();
    },
    onError: (error) => {
      console.error("Error creating entry:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося зберегти запис. Спробуйте ще раз.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast({
        title: "Порожній запис",
        description: "Будь ласка, напишіть свої думки.",
        variant: "destructive",
      });
      return;
    }

    createEntryMutation.mutate({
      content: content.trim(),
      mood: selectedMood || null,
      energyLevel: energyLevel[0],
    });
  };

  return (
    <div className="space-y-8">
      {/* New Entry Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Feather className="w-5 h-5 mr-2 text-blue-600" />
            Новий запис
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {currentPrinciple && (
              <div>
                <Label className="text-base font-medium">Принцип дня</Label>
                <div className="mt-2 bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <span className="text-blue-700 font-medium">
                    Принцип {currentPrinciple.number}: {currentPrinciple.title}
                  </span>
                </div>
              </div>
            )}
            
            <div>
              <Label htmlFor="content" className="text-base font-medium">
                Ваші роздуми та досвід
              </Label>
              <Textarea
                id="content"
                rows={6}
                className="mt-2 resize-none"
                placeholder="Поділіться своїми думками про застосування принципу сьогодні..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <Label className="text-base font-medium mb-3 block">Ваш настрій</Label>
                <div className="flex flex-wrap gap-2">
                  {moods.map((mood) => (
                    <button
                      key={mood}
                      type="button"
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-colors ${
                        selectedMood === mood
                          ? "bg-blue-100 ring-2 ring-blue-500"
                          : "bg-gray-100 hover:bg-blue-50"
                      }`}
                      onClick={() => setSelectedMood(mood === selectedMood ? "" : mood)}
                    >
                      {mood}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="text-base font-medium mb-3 block">
                  Рівень енергії: {energyLevel[0]}
                </Label>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-500">Низький</span>
                  <Slider
                    value={energyLevel}
                    onValueChange={setEnergyLevel}
                    max={10}
                    min={1}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-500">Високий</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => {
                setContent("");
                setSelectedMood("");
                setEnergyLevel([7]);
              }}>
                Очистити
              </Button>
              <Button 
                type="submit" 
                disabled={createEntryMutation.isPending}
                className="px-8"
              >
                {createEntryMutation.isPending ? "Збереження..." : "Зберегти запис"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Recent Entries */}
      {recentEntries && recentEntries.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Останні записи</h3>
          <div className="space-y-4">
            {recentEntries.map((entry: any) => (
              <Card key={entry.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-sm">
                          {entry.principle?.number || "?"}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {entry.principle?.title || "Невідомий принцип"}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {new Date(entry.createdAt).toLocaleDateString("uk-UA", {
                            day: "numeric",
                            month: "long",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {entry.mood && <span className="text-2xl">{entry.mood}</span>}
                      {entry.energyLevel && (
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: 10 }).map((_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full ${
                                i < entry.energyLevel ? "bg-green-500" : "bg-gray-200"
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{entry.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
