import { Link, useLocation } from 'wouter';
import { 
  LayoutDashboard, 
  MessageCircle, 
  BarChart3, 
  Trophy, 
  User, 
  Settings 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/dashboard', label: 'Огляд', icon: LayoutDashboard },
  { path: '/chat', label: 'AI Чат', icon: MessageCircle },
  { path: '/analytics', label: 'Аналітика', icon: BarChart3 },
  { path: '/achievements', label: 'Досягнення', icon: Trophy },
  { path: '/profile', label: 'Профіль', icon: User },
  { path: '/settings', label: 'Налаштування', icon: Settings },
];

export function MainNav() {
  const [location] = useLocation();

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex items-center gap-6 px-6 py-4 border-b border-border/40 bg-background/80 backdrop-blur-sm">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location === path;
          return (
            <Link key={path} href={path}>
              <a className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}>
                <Icon className="h-4 w-4" />
                {label}
              </a>
            </Link>
          );
        })}
      </nav>

      {/* Mobile Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-lg border-t border-border/40">
        <div className="grid grid-cols-6 h-16">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location === path;
            return (
              <Link key={path} href={path}>
                <a className={cn(
                  "flex flex-col items-center justify-center h-full text-xs font-medium transition-colors",
                  isActive 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-foreground"
                )}>
                  <Icon className="h-5 w-5 mb-1" />
                  <span className="truncate">{label}</span>
                </a>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom padding for mobile content */}
      <div className="lg:hidden h-16" />
    </>
  );
}