import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Zap, Battery, Feather, Settings, Loader } from "lucide-react";
import { getQueryFn } from "@/lib/queryClient";

interface ReminderMode {
  id: string;
  name: string;
  description: string;
  principlesPerDay: number;
  schedule: { time: string; type: 'principle' | 'reflection' }[];
  icon: string;
  color: string;
}

interface ReminderModeSelectorProps {
  selectedMode: string;
  onModeSelect: (mode: string) => void;
}

const iconMap = {
  zap: Zap,
  battery: Battery,
  feather: Feather,
  settings: Settings,
};

const colorMap = {
  red: 'bg-red-100 text-red-700 border-red-200',
  green: 'bg-green-100 text-green-700 border-green-200',
  blue: 'bg-blue-100 text-blue-700 border-blue-200',
  purple: 'bg-purple-100 text-purple-700 border-purple-200',
};

export default function ReminderModeSelector({ selectedMode, onModeSelect }: ReminderModeSelectorProps) {
  const { data: modes, isLoading, isError } = useQuery({
    queryKey: ['/api/reminders/modes'],
    queryFn: getQueryFn<ReminderMode[]>({ on401: "throw" }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="h-6 w-6 animate-spin" />
        <span className="ml-2">Завантаження режимів...</span>
      </div>
    );
  }

  if (isError || !modes) {
    return (
      <div className="text-center py-8 text-red-600">
        Помилка завантаження режимів нагадувань
      </div>
    );
  }

  // Add custom mode
  const allModes = [
    ...modes,
    {
      id: 'custom',
      name: 'Власний',
      description: 'Налаштуйте розклад під себе',
      principlesPerDay: 0,
      schedule: [],
      icon: 'settings',
      color: 'purple',
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {allModes.map((mode) => {
        const IconComponent = iconMap[mode.icon as keyof typeof iconMap] || Settings;
        const colorClass = colorMap[mode.color as keyof typeof colorMap] || colorMap.purple;

        return (
          <Card
            key={mode.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedMode === mode.id ? 'ring-2 ring-purple-600' : ''
            }`}
            onClick={() => onModeSelect(mode.id)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${colorClass}`}>
                  <IconComponent className="h-5 w-5" />
                </div>
                {selectedMode === mode.id && (
                  <Badge variant="secondary">Обрано</Badge>
                )}
              </div>
              
              <h3 className="font-semibold text-lg mb-2">{mode.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{mode.description}</p>
              
              {mode.id !== 'custom' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{mode.principlesPerDay} принципи щодня</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Нагадування: {mode.schedule.map(s => s.time).join(', ')}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}