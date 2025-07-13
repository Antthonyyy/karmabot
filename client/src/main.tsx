import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import './i18n/config';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n/config';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import initSentry from './utils/sentry';
import initWebVitals from './utils/webVitals';
import { initMobileOptimizations } from './utils/mobile';

// Initialize monitoring and analytics
initSentry();
initWebVitals();

// Initialize mobile optimizations
initMobileOptimizations();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <TooltipProvider>
        <I18nextProvider i18n={i18n}>
          <App />
        </I18nextProvider>
      </TooltipProvider>
    </ErrorBoundary>
  </StrictMode>
);

// Register Service Worker for PWA functionality
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('🔮 Service Worker registered successfully:', registration.scope);

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              if (confirm('Доступна нова версія додатку. Оновити зараз?')) {
                window.location.reload();
              }
            }
          });
        }
      });
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
    }
  });
}
