import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { SupabaseAppConfig, BackendConnectionStatus } from '../types';

const STORAGE_KEY_SUPABASE_CONFIG = 'school_debate_supabase_config';

export function getStoredSupabaseConfig(): SupabaseAppConfig | null {
  // 1. Check browser localStorage
  const saved = localStorage.getItem(STORAGE_KEY_SUPABASE_CONFIG);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.supabaseUrl && parsed.supabaseAnonKey) {
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse saved Supabase config', e);
    }
  }

  // 2. Check Vite Environment Variables (Vercel / .env.local)
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (envUrl && envKey) {
    return {
      supabaseUrl: envUrl,
      supabaseAnonKey: envKey,
    };
  }

  return null;
}

export function saveSupabaseConfig(config: SupabaseAppConfig): void {
  localStorage.setItem(STORAGE_KEY_SUPABASE_CONFIG, JSON.stringify(config));
  window.location.reload();
}

export function clearSupabaseConfig(): void {
  localStorage.removeItem(STORAGE_KEY_SUPABASE_CONFIG);
  window.location.reload();
}

let supabase: SupabaseClient | null = null;
let connectionStatus: BackendConnectionStatus = {
  isConfigured: false,
  isConnected: true, // local broadcast fallback is active
  isUsingFallback: true,
  provider: 'local',
};

const config = getStoredSupabaseConfig();

if (config && config.supabaseUrl && config.supabaseAnonKey) {
  try {
    supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });

    connectionStatus = {
      isConfigured: true,
      isConnected: true,
      isUsingFallback: false,
      provider: 'supabase',
    };
  } catch (err: unknown) {
    console.error('Supabase initialization error:', err);
    connectionStatus = {
      isConfigured: true,
      isConnected: false,
      isUsingFallback: true,
      provider: 'supabase',
      error: err instanceof Error ? err.message : String(err),
    };
  }
} else {
  connectionStatus = {
    isConfigured: false,
    isConnected: true,
    isUsingFallback: true,
    provider: 'local',
  };
}

export { supabase, connectionStatus };
