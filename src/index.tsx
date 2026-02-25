
import React from 'react';
import './index.css';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import App from './App';

// Emergency Service Worker Cleanup
// This ensures that any previous buggy service workers are removed immediately
// to prevent "Failed to fetch" errors caused by SW interception.
if ('serviceWorker' in navigator) {
  try {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (const registration of registrations) {
        registration.unregister().catch((err) => {
          console.warn('SW unregister failed:', err);
        });
      }
    }).catch((err) => {
      // This catch block handles "The document is in an invalid state" error
      // which can happen during rapid reloads or specific browser states
      console.warn('Service Worker access failed:', err);
    });
  } catch (e) {
    console.warn('Service Worker not supported or access denied:', e);
  }
}

const rootElement = document.querySelector('#root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
