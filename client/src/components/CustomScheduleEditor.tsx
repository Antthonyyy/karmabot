import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Clock } from "lucide-react";

export interface ScheduleItem {
  time: string;
  type: 'principle' | 'reflection';
  enabled: boolean;
}

interface CustomScheduleEditorProps {
  schedule: ScheduleItem[];
  onChange: (schedule: ScheduleItem[]) => void;
  principlesCount: number;
  onPrinciplesCountChange: (count: number) => void;
}

export default function CustomScheduleEditor({ 
  schedule, 
  onChange, 
  principlesCount,
  onPrinciplesCountChange 
}: CustomScheduleEditorProps) {
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
  
  const principleReminders = schedule.filter(s => s.type === 'principle' && s.enabled).length;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Налаштування власного розкладу</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Кількість принципів */}
        <div className="space-y-2">
          <Label>Скільки принципів на день ви хочете практикувати?</Label>
          <Select
            value={principlesCount.toString()}
            onValueChange={(value) => onPrinciplesCountChange(parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Оберіть кількість" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2 принципи (мінімум)</SelectItem>
              <SelectItem value="3">3 принципи</SelectItem>
              <SelectItem value="4">4 принципи</SelectItem>
              <SelectItem value="5">5 принципів</SelectItem>
              <SelectItem value="6">6 принципів (максимум)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Попередження про кількість */}
        {principleReminders < principlesCount && (
          <div className="bg-yellow-50 p-3 rounded-lg text-sm text-yellow-800">
            ⚠️ Додайте ще {principlesCount - principleReminders} нагадування для принципів
          </div>
        )}
        
        {/* Список нагадувань */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Розклад нагадувань</Label>
            <Button
              size="sm"
              variant="outline"
              onClick={addScheduleItem}
              className="h-8"
            >
              <Plus className="h-4 w-4 mr-1" />
              Додати
            </Button>
          </div>
          
          {schedule.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Натисніть "Додати" щоб створити нагадування
            </div>
          )}
          
          {schedule.map((item, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Clock className="h-4 w-4 text-gray-400" />
              
              <Input
                type="time"
                value={item.time}
                onChange={(e) => updateScheduleItem(index, { time: e.target.value })}
                className="w-32"
              />
              
              <Select
                value={item.type}
                onValueChange={(value) => 
                  updateScheduleItem(index, { type: value as 'principle' | 'reflection' })
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Тип нагадування" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="principle">Новий принцип</SelectItem>
                  <SelectItem value="reflection">Вечірня рефлексія</SelectItem>
                </SelectContent>
              </Select>
              
              <Switch
                checked={item.enabled}
                onCheckedChange={(enabled) => updateScheduleItem(index, { enabled })}
              />
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeScheduleItem(index)}
                className="h-8 w-8 p-0 text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        
        {/* Рекомендації */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-sm text-blue-900 mb-2">Рекомендації:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Розподіліть нагадування рівномірно протягом дня</li>
            <li>• Додайте рефлексію ввечері для підведення підсумків</li>
            <li>• Починайте з 2-3 принципів і збільшуйте поступово</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}