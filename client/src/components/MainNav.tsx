import { Link, useLocation } from 'wouter';
import { Home, Bot, LineChart, Trophy, UserCircle, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigationItems = [
  { path: '/dashboard', icon: Home, label: 'Огляд' },
  { path: '/chat', icon: Bot, label: 'AI Чат' },
  { path: '/analytics', icon: LineChart, label: 'Аналітика' },
  { path: '/achievements', icon: Trophy, label: 'Досягнення' },
  { path: '/profile', icon: UserCircle, label: 'Профіль' },
  { path: '/settings', icon: Settings, label: 'Налаштування' },
];

export default function MainNav() {
  const [location] = useLocation();

  return (
    <>
      {/* Desktop TopBar */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 h-14 z-40 backdrop-blur-lg border-b border-white/10 bg-white/70 dark:bg-slate-900/70 px-4 gap-4 items-center">
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
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <IconComponent className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Mobile BottomBar */}
      <nav className="flex md:hidden fixed bottom-0 left-0 right-0 h-14 z-40 backdrop-blur-lg border-t border-white/10 bg-white/90 dark:bg-slate-900/90 px-1 justify-between">
        {navigationItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = location === item.path;
          
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex flex-col items-center justify-center px-2 py-1 rounded-lg text-xs font-medium transition-all duration-200 flex-1",
                isActive
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <IconComponent className="w-5 h-5 mb-1" />
              <span className="hidden xs:inline text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}