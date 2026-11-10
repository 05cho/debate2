import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth, signInAnonymously } from 'firebase/auth';
import type { FirebaseAppConfig, FirebaseConnectionStatus } from '../types';

const STORAGE_KEY_FIREBASE_CONFIG = 'school_debate_firebase_config';

// Load configuration from Vite env or local storage
export function getStoredFirebaseConfig(): FirebaseAppConfig | null {
  // 1. Check browser localStorage
  const saved = localStorage.getItem(STORAGE_KEY_FIREBASE_CONFIG);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse saved Firebase config', e);
    }
  }

  // 2. Check Vite Environment Variables (Vercel / .env.local)
  const envApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const envProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

  if (envApiKey && envProjectId) {
    return {
      apiKey: envApiKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${envProjectId}.firebaseapp.com`,
      projectId: envProjectId,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${envProjectId}.appspot.com`,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
      firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || '(default)',
    };
  }

  return null;
}

export function saveFirebaseConfig(config: FirebaseAppConfig): void {
  localStorage.setItem(STORAGE_KEY_FIREBASE_CONFIG, JSON.stringify(config));
  window.location.reload();
}

export function clearFirebaseConfig(): void {
  localStorage.removeItem(STORAGE_KEY_FIREBASE_CONFIG);
  window.location.reload();
}

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let connectionStatus: FirebaseConnectionStatus = {
  isConfigured: false,
  isConnected: false,
  isUsingFallback: true,
  provider: 'firebase',
};

const config = getStoredFirebaseConfig();

if (config && config.apiKey && config.projectId) {
  try {
    if (!getApps().length) {
      app = initializeApp(config);
    } else {
      app = getApps()[0];
    }
    db = getFirestore(app);
    auth = getAuth(app);

    // Sign in anonymously for basic auth identity if desired
    signInAnonymously(auth).catch((err) => {
      console.warn('Anonymous auth note (check Firebase console if anonymous sign-in is disabled):', err.message);
    });

    connectionStatus = {
      isConfigured: true,
      isConnected: true,
      isUsingFallback: false,
      provider: 'firebase',
    };
  } catch (err: unknown) {
    console.error('Firebase initialization error:', err);
    connectionStatus = {
      isConfigured: true,
      isConnected: false,
      isUsingFallback: true,
      provider: 'firebase',
      error: err instanceof Error ? err.message : String(err),
    };
  }
} else {
  // Not configured yet - will use high-fidelity browser BroadcastChannel + LocalStorage fallback
  connectionStatus = {
    isConfigured: false,
    isConnected: true, // Local online sync is active
    isUsingFallback: true,
    provider: 'local',
  };
}

export { app, db, auth, connectionStatus };
