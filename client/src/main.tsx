import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import './i18n/config';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n/config';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { GoogleOAuthProvider } from '@react-oauth/google';

const queryClient = new QueryClient();
const GOOGLE_CLIENT_ID = "796005593005-7q1fvv3bunmtat53thmevg1oe9mfdbuv.apps.googleusercontent.com";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <I18nextProvider i18n={i18n}>
            <App />
          </I18nextProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
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

// Handle install prompt for PWA
let deferredPrompt: any;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log('🔮 PWA install prompt available');
});

window.addEventListener('appinstalled', () => {
  console.log('🔮 PWA was installed successfully');
  deferredPrompt = null;
});
