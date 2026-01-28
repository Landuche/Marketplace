import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  release: "marketplace-frontend@1.0.0",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracePropagationTargets: ["localhost"],
  
  tracesSampleRate: 1.0, 
  replaysSessionSampleRate: 0.1, 
  replaysOnErrorSampleRate: 1.0, 
  
  environment: import.meta.env.VITE_SENTRY_ENV || 'development',
  debug: true,
});

createRoot(document.getElementById('root')!).render(<App />);
