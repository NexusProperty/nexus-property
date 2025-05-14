import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { supabase, initializeCsrfProtection } from '@/lib/supabase'

// Initialize CSRF protection
initializeCsrfProtection().catch(error => {
  console.error('Failed to initialize CSRF protection:', error);
});

createRoot(document.getElementById("root")!).render(<App />);
