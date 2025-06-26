import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    localStorage.setItem('theme', theme);
    
    const updateTheme = () => {
      if (theme === 'system') {
        const hour = new Date().getHours();
        const isDarkTime = hour >= 20 || hour < 6; // 20:00 - 6:00
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setResolvedTheme(isDarkTime || prefersDark ? 'dark' : 'light');
      } else {
        setResolvedTheme(theme as 'light' | 'dark');
      }
    };

    updateTheme();
    
    // Проверяем каждую минуту для автопереключения
    const interval = setInterval(updateTheme, 60000);
    
    // Слушаем изменения системной темы
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateTheme);
    
    return () => {
      clearInterval(interval);
      mediaQuery.removeEventListener('change', updateTheme);
    };
  }, [theme]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
  }, [resolvedTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};