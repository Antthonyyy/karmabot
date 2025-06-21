import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Clock, Bell } from "lucide-react";

export interface ScheduleItem {
  time: string;
  type: 'principle' | 'reflection';
  enabled: boolean;
}

interface CustomScheduleEditorProps {
  schedule: ScheduleItem[];
  onChange: (schedule: ScheduleItem[]) => void;
}

export default function CustomScheduleEditor({ schedule, onChange }: CustomScheduleEditorProps) {
  const addScheduleItem = () => {
    const newItem: ScheduleItem = {
      time: '12:00',
      type: 'principle',
      enabled: true,
    };
    onChange([...schedule, newItem]);
  };
  
  const removeScheduleItem = (index: number) => {
    onChange(schedule.filter((_, i) => i !== index));
  };
  
  const updateScheduleItem = (index: number, updates: Partial<ScheduleItem>) => {
    const newSchedule = [...schedule];
    newSchedule[index] = { ...newSchedule[index], ...updates };
    onChange(newSchedule);
  };
  
  // Сортировка по времени для отображения
  const sortedSchedule = [...schedule].sort((a, b) => a.time.localeCompare(b.time));
  
  // Подсчет принципов для информации
  const principleCount = schedule.filter(s => s.type === 'principle' && s.enabled).length;
  const reflectionCount = schedule.filter(s => s.type === 'reflection' && s.enabled).length;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Налаштування власного розкладу</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Информационная панель */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-blue-900 mb-2">Ваш розклад:</p>
          <div className="flex gap-4 text-sm text-blue-700">
            <span className="flex items-center gap-1">
              <Bell className="h-3 w-3" />
              {principleCount} {principleCount === 1 ? 'принцип' : 'принципи'}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {reflectionCount} рефлексія
            </span>
          </div>
        </div>
        
        {/* Кнопка добавления */}
        <div className="flex items-center justify-between">
          <Label>Розклад нагадувань</Label>
          <Button
            size="sm"
            variant="outline"
            onClick={addScheduleItem}
            className="h-8"
          >
            <Plus className="h-4 w-4 mr-1" />
            Додати нагадування
          </Button>
        </div>
        
        {/* Список напоминаний */}
        <div className="space-y-3">
          
          {schedule.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Натисніть "Додати нагадування" щоб створити розклад
            </div>
          )}
          
          {sortedSchedule.map((item, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Clock className="h-4 w-4 text-gray-400" />
              
              <Input
                type="time"
                value={item.time}
                onChange={(e) => updateScheduleItem(
                  schedule.indexOf(item), 
                  { time: e.target.value }
                )}
                className="w-32"
              />
              
              <select
                value={item.type}
                onChange={(e) => updateScheduleItem(
                  schedule.indexOf(item), 
                  { type: e.target.value as 'principle' | 'reflection' }
                )}
                className="flex h-10 w-40 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="principle">Новий принцип</option>
                <option value="reflection">Вечірня рефлексія</option>
              </select>
              
              <Switch
                checked={item.enabled}
                onCheckedChange={(enabled) => updateScheduleItem(
                  schedule.indexOf(item), 
                  { enabled }
                )}
              />
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeScheduleItem(schedule.indexOf(item))}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        
        {/* Рекомендации */}
        <div className="bg-amber-50 p-4 rounded-lg">
          <h4 className="font-medium text-sm text-amber-900 mb-2">Рекомендації:</h4>
          <ul className="text-sm text-amber-700 space-y-1">
            <li>• Додайте мінімум 2 нагадування для принципів на день</li>
            <li>• Розподіліть нагадування рівномірно протягом дня</li>
            <li>• Додайте вечірню рефлексію для підведення підсумків</li>
            <li>• Встановіть зручний для вас час</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}