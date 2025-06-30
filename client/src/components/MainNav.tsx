import { Link, useLocation } from 'wouter';
import { Home, MessageCircle, BarChart3, Trophy, User, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigationItems = [
  { path: '/dashboard', icon: Home, label: 'Головна', mobileLabel: 'Головна' },
  { path: '/chat', icon: MessageCircle, label: 'AI Чат', mobileLabel: 'Чат' },
  { path: '/analytics', icon: BarChart3, label: 'Аналітика', mobileLabel: 'Статистика' },
  { path: '/achievements', icon: Trophy, label: 'Досягнення', mobileLabel: 'Нагороди' },
  { path: '/profile', icon: User, label: 'Профіль', mobileLabel: 'Профіль' },
  { path: '/settings', icon: Settings, label: 'Налаштування', mobileLabel: 'Налаштування' },
];

export function MainNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-white/20 dark:border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = location === item.path;
              
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}