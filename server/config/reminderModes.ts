export interface ReminderMode {
  id: string;
  name: string;
  description: string;
  principlesPerDay: number;
  schedule: { time: string; type: 'principle' | 'reflection' }[];
  icon: string;
  color: string;
}

export const reminderModes: ReminderMode[] = [
  {
    id: 'intensive',
    name: 'Інтенсивний',
    description: 'Максимальна практика з 4 принципами щодня',
    principlesPerDay: 4,
    schedule: [
      { time: '07:00', type: 'principle' },
      { time: '11:00', type: 'principle' },
      { time: '15:00', type: 'principle' },
      { time: '19:00', type: 'principle' },
      { time: '21:00', type: 'reflection' },
    ],
    icon: 'zap',
    color: 'red',
  },
  {
    id: 'balanced',
    name: 'Збалансований',
    description: '3 принципи щодня для стабільного прогресу',
    principlesPerDay: 3,
    schedule: [
      { time: '08:00', type: 'principle' },
      { time: '13:00', type: 'principle' },
      { time: '18:00', type: 'principle' },
      { time: '21:00', type: 'reflection' },
    ],
    icon: 'battery',
    color: 'green',
  },
  {
    id: 'light',
    name: 'Легкий',
    description: '2 принципи щодня для початківців',
    principlesPerDay: 2,
    schedule: [
      { time: '09:00', type: 'principle' },
      { time: '15:00', type: 'principle' },
      { time: '20:00', type: 'reflection' },
    ],
    icon: 'feather',
    color: 'blue',
  },
];

export function getReminderModeById(id: string): ReminderMode | undefined {
  return reminderModes.find(mode => mode.id === id);
}

export function getDefaultScheduleForMode(modeId: string): { time: string; type: 'principle' | 'reflection' }[] {
  const mode = getReminderModeById(modeId);
  return mode ? mode.schedule : [];
}