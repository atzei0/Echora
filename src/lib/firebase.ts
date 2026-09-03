import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const isConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let app;
if (!getApps().length) {
  if (isConfigured) {
    app = initializeApp(firebaseConfig);
  } else {
    console.warn(
      '⚠️ Configurazione Firebase mancante. Assicurati di impostare VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, ecc. nelle variabili d\'ambiente.'
    );
    app = initializeApp({
      apiKey: 'placeholder-api-key',
      authDomain: 'placeholder.firebaseapp.com',
      projectId: 'placeholder-project',
      appId: '1:000000000000:web:000000000000',
    });
  }
} else {
  app = getApp();
}

export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

const firestoreDatabaseId =
  import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID ||
  import.meta.env.VITE_FIREBASE_DATABASE_ID;

export const db = firestoreDatabaseId && firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firestoreDatabaseId)
  : getFirestore(app);

export default app;

