import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve credentials from Vite or Next.js environment
const getEnvVar = (key: string): string => {
  if (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.[key]) {
    return (import.meta as any).env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] || '';
  }
  return '';
};

// Check local storage for runtime tester credentials if any
const getStoredCredential = (key: string): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(`fessy_${key}`) || '';
  }
  return '';
};

export const DEFAULT_SUPABASE_URL = 'https://yytafihildxcdlaonijk.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5dGFmaWhpbGR4Y2RsYW9uaWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0NTA0NTUsImV4cCI6MjEwNTAyNjQ1NX0.K7n2k1iMBZ0I6BJxJZfdMXnhUObJoom0zT3N1yfwuZs';

export const getSupabaseConfig = () => {
  const url =
    getStoredCredential('supabase_url') ||
    getEnvVar('VITE_SUPABASE_URL') ||
    getEnvVar('NEXT_PUBLIC_SUPABASE_URL') ||
    DEFAULT_SUPABASE_URL;
  
  const anonKey =
    getStoredCredential('supabase_anon_key') ||
    getEnvVar('VITE_SUPABASE_ANON_KEY') ||
    getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
    DEFAULT_SUPABASE_ANON_KEY;

  return { url, anonKey, isConfigured: Boolean(url && anonKey) };
};

export const createFessyClient = (): SupabaseClient | null => {
  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;
  try {
    return createClient(url, anonKey);
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
};

export const supabase = createFessyClient();
