import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Импорт всех переводов
import commonUk from '../locales/uk/common.json';
import subscriptionsUk from '../locales/uk/subscriptions.json';
import aiUk from '../locales/uk/ai.json';
import achievementsUk from '../locales/uk/achievements.json';

import commonEn from '../locales/en/common.json';
import subscriptionsEn from '../locales/en/subscriptions.json';
import aiEn from '../locales/en/ai.json';
import achievementsEn from '../locales/en/achievements.json';

const resources = {
  uk: {
    common: commonUk,
    subscriptions: subscriptionsUk,
    ai: aiUk,
    achievements: achievementsUk
  },
  en: {
    common: commonEn,
    subscriptions: subscriptionsEn,
    ai: aiEn,
    achievements: achievementsEn
  }
};

// Get saved language or default to Ukrainian (with safety check for localStorage)
const savedLanguage = (typeof window !== 'undefined' && localStorage.getItem('karma_language')) || 'uk';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'uk',
    
    ns: ['common', 'subscriptions', 'ai', 'achievements'],
    defaultNS: 'common',
    
    interpolation: {
      escapeValue: false
    },
    
    react: {
      useSuspense: false
    }
  });

export default i18n;