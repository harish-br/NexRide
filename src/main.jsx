import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client'
import { ScreenOrientation } from '@capacitor/screen-orientation';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css'
import './portrait-lock.css'
import App from './App.jsx'

// Lock orientation to portrait
ScreenOrientation.lock({ orientation: 'portrait' })
  .catch((err) => {
    // Fails on browser mainly, can be ignored or logged
    console.log('ScreenOrientation lock failed (likely browser)', err);
  });

// Version verification log
console.log('NexRide App Version: 2026-01-01 T19:02 (Strict Haptics)');

// Debug Logging (TEMPORARY)
console.log("Android:", /Android/i.test(navigator.userAgent));
console.log("Vibrate support:", !!navigator.vibrate);
console.log("User Agent:", navigator.userAgent);

// Request permission for Notifications early (optional, but good for debugging)
if ('Notification' in window && Notification.permission !== 'granted') {
  console.log('Notification permission status:', Notification.permission);
}

import i18n from './i18n'
import { I18nextProvider } from 'react-i18next'
import { LanguageProvider } from './components/LanguageContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <LanguageProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </LanguageProvider>
    </I18nextProvider>
  </StrictMode>,
)
