import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  
  const toggleLanguage = () => {
    const newLang = i18n.language === 'uk' ? 'en' : 'uk';
    i18n.changeLanguage(newLang);
    localStorage.setItem('karma_language', newLang);
  };
  
  // Safeguard against undefined language
  const currentLanguage = i18n?.language || 'uk';
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="flex items-center gap-2"
    >
      <Languages className="w-4 h-4" />
      {currentLanguage.toUpperCase()}
    </Button>
  );
}