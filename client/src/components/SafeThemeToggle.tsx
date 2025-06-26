import { ThemeToggle } from './ThemeToggle';
import { useEffect, useState } from 'react';

export function SafeThemeToggle() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Предотвращаем рендеринг до монтирования компонента
  if (!mounted) {
    return <div className="w-9 h-9" />; // Placeholder с тем же размером что и кнопка
  }

  return <ThemeToggle />;
}