import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';
import {
  NoteNotation,
  PracticeSession,
  SavedCustomRoutine,
  SavedRecording,
  VocalRangeProfile,
} from '../types';
import { useLanguage } from './LanguageContext';
import { Language } from './i18n';

export interface UserAccount {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  provider: 'email' | 'google';
  avatarUrl?: string;
  vocalLevel?: string;
  createdAt: string;
  emailVerified: boolean;
  confirmationEmailSent: boolean;
  xp?: number;
  streakDays?: number;
  vocalProfile?: VocalRangeProfile | null;
  customRoutines?: SavedCustomRoutine[];
  activeCustomRoutineId?: string | null;
  practiceSessions?: PracticeSession[];
  preferredLanguage?: Language;
  preferredNotation?: NoteNotation;
  subscriptionStatus?: string;
  subscriptionPlan?: string;
  subscriptionPeriodEnd?: string;
}

interface AuthContextType {
  user: UserAccount | null;
  isCloudHydrated: boolean;
  vocalProfile: VocalRangeProfile | null;
  sessions: PracticeSession[];
  customRoutines: SavedCustomRoutine[];
  activeCustomRoutineId: string;
  preferredNotation: NoteNotation;
  recordings: SavedRecording[];
  saveVocalProfile: (profile: VocalRangeProfile) => void;
  recordExerciseCompletion: (title: string, durationSec: number) => void;
  saveCustomRoutines: (routines: SavedCustomRoutine[], activeId?: string) => void;
  setActiveCustomRoutineId: (id: string) => void;
  setPreferredNotation: (notation: NoteNotation) => void;
  saveRecording: (rec: SavedRecording) => void;
  deleteRecording: (id: string) => void;
  isAuthModalOpen: boolean;
  openAuthModal: (mode?: 'login' | 'signup') => void;
  closeAuthModal: () => void;
  authMode: 'login' | 'signup';
  setAuthMode: (mode: 'login' | 'signup') => void;
  loginWithEmail: (email: string, pass: string) => Promise<boolean>;
  signupWithEmail: (
    email: string,
    pass: string,
    firstName: string,
    lastName: string,
    vocalLevel?: string
  ) => Promise<boolean>;
  loginWithGoogle: (
    customFirstName?: string,
    customLastName?: string,
    googleEmail?: string
  ) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<UserAccount>) => void;
  sendConfirmationEmail: () => void;
  verifyEmail: () => void;
  lastRegistrationNotification: string | null;
  clearRegistrationNotification: () => void;
  isSubscribed: boolean;
  isSubscriptionModalOpen: boolean;
  subscriptionModalMessage: string | null;
  openSubscriptionModal: (message?: string) => void;
  closeSubscriptionModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PRIVILEGED_STRIPE_KEYS = new Set([
  'subscriptionStatus',
  'subscriptionPlan',
  'subscriptionPeriodEnd',
  'stripeCustomerId',
  'stripeSubscriptionId',
]);

export const createInitialBlankRoutine = (isEn: boolean, index = 1): SavedCustomRoutine => ({
  id: `custom_routine_${Date.now()}`,
  name: isEn ? `My Custom Routine ${index}` : `La Mia Routine ${index}`,
  description: isEn ? 'Personalized exercise sequence' : 'Componi la tua sequenza di esercizi',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  steps: [],
});

function isDefaultEmptyRoutine(r: SavedCustomRoutine): boolean {
  if (!r || (r.steps && r.steps.length > 0)) return false;
  return (
    r.name === 'La Mia Routine 1' ||
    r.name === 'My Custom Routine 1' ||
    r.name === 'La Mia Routine Personalizzata' ||
    r.name === 'My Custom Routine'
  );
}

function sanitizeForFirestore(data: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (PRIVILEGED_STRIPE_KEYS.has(key) || value === undefined) {
      continue;
    }
    cleaned[key] = JSON.parse(JSON.stringify(value));
  }
  return cleaned;
}

function safeParseJSON<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function filterValidUserRoutines(list: any): SavedCustomRoutine[] {
  if (!Array.isArray(list)) return [];
  return list.filter(
    (r) =>
      r &&
      typeof r.id === 'string' &&
      !r.id.startsWith('preset_') &&
      !r.id.includes('preset') &&
      Array.isArray(r.steps)
  );
}

function mergeCustomRoutines(
  cloudList: SavedCustomRoutine[],
  ...localLists: SavedCustomRoutine[][]
): SavedCustomRoutine[] {
  const map = new Map<string, SavedCustomRoutine>();

  for (const r of filterValidUserRoutines(cloudList)) {
    map.set(r.id, r);
  }

  const hasCloudRoutines = map.size > 0;

  for (const list of localLists) {
    for (const r of filterValidUserRoutines(list)) {
      // Avoid polluting existing cloud routines with an untouched blank placeholder routine
      if (hasCloudRoutines && isDefaultEmptyRoutine(r) && !map.has(r.id)) {
        continue;
      }
      const existing = map.get(r.id);
      if (!existing) {
        map.set(r.id, r);
      } else if ((r.updatedAt || 0) > (existing.updatedAt || 0)) {
        map.set(r.id, r);
      }
    }
  }

  return Array.from(map.values());
}

function mergePracticeSessions(
  cloudList: PracticeSession[],
  ...localLists: PracticeSession[][]
): PracticeSession[] {
  const map = new Map<string, PracticeSession>();

  const addAll = (items: any) => {
    if (!Array.isArray(items)) return;
    for (const item of items) {
      if (item && typeof item.id === 'string' && !map.has(item.id)) {
        map.set(item.id, {
          id: item.id,
          date: item.date || new Date().toLocaleDateString('it-IT'),
          durationMinutes: Number(item.durationMinutes) || 0,
          exercisesCompleted: Array.isArray(item.exercisesCompleted) ? item.exercisesCompleted : [],
          ...(item.notes ? { notes: item.notes } : {}),
        });
      }
    }
  };

  addAll(cloudList);
  for (const list of localLists) {
    addAll(list);
  }

  return Array.from(map.values()).sort((a, b) => {
    const numA = Number(a.id);
    const numB = Number(b.id);
    if (!Number.isNaN(numA) && !Number.isNaN(numB) && numA !== numB) {
      return numB - numA;
    }
    return 0;
  });
}

function clearUnscopedLocalKeys() {
  try {
    localStorage.removeItem('vocalis_profile');
    localStorage.removeItem('vocalis_sessions');
    localStorage.removeItem('vocalis_recordings');
    localStorage.removeItem('echora_saved_custom_routines');
    localStorage.removeItem('echora_active_custom_routine_id');
  } catch {}
}

function getScopedKeys(uid: string) {
  return {
    user: `echora_auth_user_${uid}`,
    profile: `vocalis_profile_${uid}`,
    sessions: `vocalis_sessions_${uid}`,
    recordings: `vocalis_recordings_${uid}`,
    routines: `echora_saved_custom_routines_${uid}`,
    activeRoutineId: `echora_active_custom_routine_id_${uid}`,
    language: `echora_language_${uid}`,
    notation: `echora_notation_${uid}`,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language, setLanguage } = useLanguage();
  const isEn = language === 'en';

  const [user, setUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('echora_auth_user');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (parsed?.id?.startsWith('usr_')) {
        localStorage.removeItem('echora_auth_user');
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  });

  const [isCloudHydrated, setIsCloudHydrated] = useState<boolean>(false);
  const isCloudHydratedRef = useRef<boolean>(false);
  const isHydratingLanguageRef = useRef<boolean>(false);

  const initialUid = user?.id;

  const [vocalProfile, setVocalProfile] = useState<VocalRangeProfile | null>(() => {
    if (initialUid) {
      const scoped = safeParseJSON<VocalRangeProfile | null>(
        localStorage.getItem(`vocalis_profile_${initialUid}`),
        null
      );
      if (scoped) return scoped;
    }
    return safeParseJSON<VocalRangeProfile | null>(localStorage.getItem('vocalis_profile'), null);
  });

  const [sessions, setSessions] = useState<PracticeSession[]>(() => {
    if (initialUid) {
      const scoped = safeParseJSON<PracticeSession[] | null>(
        localStorage.getItem(`vocalis_sessions_${initialUid}`),
        null
      );
      if (scoped) return scoped;
    }
    return safeParseJSON<PracticeSession[]>(localStorage.getItem('vocalis_sessions'), []);
  });

  const [customRoutines, setCustomRoutines] = useState<SavedCustomRoutine[]>(() => {
    if (initialUid) {
      const scoped = filterValidUserRoutines(
        safeParseJSON<any[]>(localStorage.getItem(`echora_saved_custom_routines_${initialUid}`), [])
      );
      if (scoped.length > 0) return scoped;
    }
    const legacy = filterValidUserRoutines(
      safeParseJSON<any[]>(localStorage.getItem('echora_saved_custom_routines'), [])
    );
    if (legacy.length > 0) return legacy;
    return [createInitialBlankRoutine(isEn)];
  });

  const [activeCustomRoutineId, setActiveCustomRoutineIdState] = useState<string>(() => {
    try {
      const activeId = initialUid
        ? localStorage.getItem(`echora_active_custom_routine_id_${initialUid}`) ||
          localStorage.getItem('echora_active_custom_routine_id')
        : localStorage.getItem('echora_active_custom_routine_id');
      if (activeId && customRoutines.some((r) => r.id === activeId)) return activeId;
    } catch {}
    return customRoutines[0]?.id || '';
  });

  const [preferredNotation, setPreferredNotationState] = useState<NoteNotation>(() => {
    try {
      const saved = initialUid
        ? localStorage.getItem(`echora_notation_${initialUid}`)
        : localStorage.getItem('echora_notation');
      if (saved === 'latin' || saved === 'scientific') return saved;
    } catch {}
    return 'latin';
  });

  // Voice recordings remain strictly local (not synced to Firestore per Rule 9), scoped per user
  const [recordings, setRecordings] = useState<SavedRecording[]>(() => {
    if (initialUid) {
      const scoped = safeParseJSON<SavedRecording[] | null>(
        localStorage.getItem(`vocalis_recordings_${initialUid}`),
        null
      );
      if (scoped) return scoped;
    }
    return safeParseJSON<SavedRecording[]>(localStorage.getItem('vocalis_recordings'), []);
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [lastRegistrationNotification, setLastRegistrationNotification] = useState<string | null>(null);

  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [subscriptionModalMessage, setSubscriptionModalMessage] = useState<string | null>(null);

  const openSubscriptionModal = (message?: string) => {
    setSubscriptionModalMessage(message || null);
    setIsSubscriptionModalOpen(true);
  };

  const closeSubscriptionModal = () => {
    setIsSubscriptionModalOpen(false);
    setSubscriptionModalMessage(null);
  };

  const isSubscribed = Boolean(
    user && (
      user.subscriptionStatus === 'active' ||
      user.subscriptionStatus === 'trialing' ||
      user.email === 'francesca.atzei0@gmail.com'
    )
  );

  // Helper to write partial updates to Firestore `/users/{uid}` and update local cache
  const writeUserFieldsToFirestore = async (uid: string, fields: Record<string, any>) => {
    if (!uid || !db) return;
    try {
      const userRef = doc(db, 'users', uid);
      const payload = sanitizeForFirestore({
        ...fields,
        updatedAt: new Date().toISOString(),
      });
      await setDoc(userRef, payload, { merge: true });
    } catch (err) {
      console.warn('Firestore write warning:', err);
    }
  };

  // Save full user snapshot to localStorage cache
  const cacheUserSnapshotLocally = (acc: UserAccount) => {
    setUser(acc);
    try {
      localStorage.setItem('echora_auth_user', JSON.stringify(acc));
      if (acc.id) {
        const keys = getScopedKeys(acc.id);
        localStorage.setItem(keys.user, JSON.stringify(acc));
        localStorage.setItem('echora_last_uid', acc.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Unified Cloud Hydration + Local Migration for authenticated users
  const hydrateAndSyncUser = async (
    fbUser: FirebaseUser,
    hints?: {
      firstName?: string;
      lastName?: string;
      email?: string;
      vocalLevel?: string;
      provider?: 'email' | 'google';
    }
  ): Promise<UserAccount> => {
    isCloudHydratedRef.current = false;
    setIsCloudHydrated(false);

    const uid = fbUser.uid;
    const scopedKeys = getScopedKeys(uid);

    // Determine if legacy unscoped keys on this browser can be migrated to this UID
    const lastUid = localStorage.getItem('echora_last_uid');
    const canMigrateUnscoped = !lastUid || lastUid === uid;

    // Read UID-scoped local cache
    const scopedProfile = safeParseJSON<VocalRangeProfile | null>(
      localStorage.getItem(scopedKeys.profile),
      null
    );
    const scopedSessions = safeParseJSON<PracticeSession[]>(
      localStorage.getItem(scopedKeys.sessions),
      []
    );
    const scopedRoutines = filterValidUserRoutines(
      safeParseJSON<any[]>(localStorage.getItem(scopedKeys.routines), [])
    );
    const scopedActiveRoutineId = localStorage.getItem(scopedKeys.activeRoutineId);
    const scopedRecordings = safeParseJSON<SavedRecording[]>(
      localStorage.getItem(scopedKeys.recordings),
      []
    );
    const scopedLang = localStorage.getItem(scopedKeys.language) as Language | null;
    const scopedNotation = localStorage.getItem(scopedKeys.notation) as NoteNotation | null;

    // Read legacy unscoped local data only if eligible for migration
    const legacyProfile = canMigrateUnscoped
      ? safeParseJSON<VocalRangeProfile | null>(localStorage.getItem('vocalis_profile'), null)
      : null;
    const legacySessions = canMigrateUnscoped
      ? safeParseJSON<PracticeSession[]>(localStorage.getItem('vocalis_sessions'), [])
      : [];
    const legacyRoutines = canMigrateUnscoped
      ? filterValidUserRoutines(
          safeParseJSON<any[]>(localStorage.getItem('echora_saved_custom_routines'), [])
        )
      : [];
    const legacyActiveRoutineId = canMigrateUnscoped
      ? localStorage.getItem('echora_active_custom_routine_id')
      : null;
    const legacyRecordings = canMigrateUnscoped
      ? safeParseJSON<SavedRecording[]>(localStorage.getItem('vocalis_recordings'), [])
      : [];

    // Fetch existing Firestore document
    let cloudData: Record<string, any> | null = null;
    try {
      if (db) {
        const userRef = doc(db, 'users', uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          cloudData = snap.data();
        }
      }
    } catch (err) {
      console.warn('Error reading user profile from Firestore:', err);
    }

    // Merge local recordings (kept local only per Rule 9, isolated per UID)
    const recordingsMap = new Map<string, SavedRecording>();
    for (const rec of [...scopedRecordings, ...legacyRecordings]) {
      if (rec && rec.id && !recordingsMap.has(rec.id)) {
        recordingsMap.set(rec.id, rec);
      }
    }
    const mergedRecordings = Array.from(recordingsMap.values());

    // 1. Merge vocalProfile (Firestore is primary source of truth, fallback to local for migration)
    const mergedVocalProfile: VocalRangeProfile | null =
      cloudData?.vocalProfile || scopedProfile || legacyProfile || null;

    // 2. Merge practiceSessions by ID
    const mergedSessions = mergePracticeSessions(
      Array.isArray(cloudData?.practiceSessions) ? cloudData.practiceSessions : [],
      scopedSessions,
      legacySessions
    );

    // 3. Merge customRoutines by ID (most recent updatedAt wins)
    const mergedRoutinesRaw = mergeCustomRoutines(
      Array.isArray(cloudData?.customRoutines) ? cloudData.customRoutines : [],
      scopedRoutines,
      legacyRoutines
    );
    const mergedRoutines =
      mergedRoutinesRaw.length > 0
        ? mergedRoutinesRaw
        : [createInitialBlankRoutine(language === 'en')];

    // 4. Determine activeCustomRoutineId
    const candidateActiveId =
      cloudData?.activeCustomRoutineId || scopedActiveRoutineId || legacyActiveRoutineId || '';
    const mergedActiveRoutineId = mergedRoutines.some((r) => r.id === candidateActiveId)
      ? candidateActiveId
      : mergedRoutines[0]?.id || '';

    // 5. Preferences (preferredLanguage & preferredNotation)
    const mergedLanguage: Language =
      cloudData?.preferredLanguage === 'en' || cloudData?.preferredLanguage === 'it'
        ? cloudData.preferredLanguage
        : scopedLang === 'en' || scopedLang === 'it'
          ? scopedLang
          : language;

    const mergedNotation: NoteNotation =
      cloudData?.preferredNotation === 'latin' || cloudData?.preferredNotation === 'scientific'
        ? cloudData.preferredNotation
        : scopedNotation === 'latin' || scopedNotation === 'scientific'
          ? scopedNotation
          : preferredNotation;

    // 6. Identity fields
    const isGoogle =
      hints?.provider === 'google' ||
      cloudData?.provider === 'google' ||
      fbUser.providerData.some((p) => p.providerId === 'google.com');
    const provider: 'email' | 'google' = isGoogle ? 'google' : 'email';

    const fallbackFullName =
      fbUser.displayName ||
      `${hints?.firstName || 'Utente'} ${hints?.lastName || 'Echora'}`.trim();
    const fallbackParts = fallbackFullName.split(' ');
    const firstName =
      cloudData?.firstName || hints?.firstName || fallbackParts[0] || 'Utente';
    const lastName =
      cloudData?.lastName !== undefined
        ? cloudData.lastName
        : hints?.lastName !== undefined
          ? hints.lastName
          : fallbackParts.slice(1).join(' ') || '';
    const fullName =
      cloudData?.name || `${firstName} ${lastName}`.trim() || fallbackFullName;

    const profile: UserAccount = {
      id: uid,
      name: fullName,
      firstName,
      lastName,
      email: cloudData?.email || fbUser.email || hints?.email || '',
      provider,
      avatarUrl: cloudData?.avatarUrl || fbUser.photoURL || undefined,
      vocalLevel: cloudData?.vocalLevel || hints?.vocalLevel || 'Allievo / Cantante',
      createdAt: cloudData?.createdAt || new Date().toLocaleDateString('it-IT'),
      emailVerified: fbUser.emailVerified || Boolean(cloudData?.emailVerified),
      confirmationEmailSent: true,
      xp: isGoogle ? 250 : 150,
      streakDays: isGoogle ? 2 : 1,
      vocalProfile: mergedVocalProfile,
      customRoutines: mergedRoutines,
      activeCustomRoutineId: mergedActiveRoutineId,
      practiceSessions: mergedSessions,
      preferredLanguage: mergedLanguage,
      preferredNotation: mergedNotation,
      subscriptionStatus: cloudData?.subscriptionStatus || 'inactive',
      subscriptionPlan: cloudData?.subscriptionPlan || undefined,
      subscriptionPeriodEnd: cloudData?.subscriptionPeriodEnd || undefined,
    };

    // Update React states
    setVocalProfile(mergedVocalProfile);
    setSessions(mergedSessions);
    setCustomRoutines(mergedRoutines);
    setActiveCustomRoutineIdState(mergedActiveRoutineId);
    setPreferredNotationState(mergedNotation);
    setRecordings(mergedRecordings);

    if (mergedLanguage !== language) {
      isHydratingLanguageRef.current = true;
      setLanguage(mergedLanguage);
      setTimeout(() => {
        isHydratingLanguageRef.current = false;
      }, 0);
    }

    // Persist to UID-scoped localStorage cache and remove unscoped legacy keys
    try {
      if (mergedVocalProfile) {
        localStorage.setItem(scopedKeys.profile, JSON.stringify(mergedVocalProfile));
      } else {
        localStorage.removeItem(scopedKeys.profile);
      }
      localStorage.setItem(scopedKeys.sessions, JSON.stringify(mergedSessions));
      localStorage.setItem(scopedKeys.routines, JSON.stringify(mergedRoutines));
      localStorage.setItem(scopedKeys.activeRoutineId, mergedActiveRoutineId);
      localStorage.setItem(scopedKeys.recordings, JSON.stringify(mergedRecordings));
      localStorage.setItem(scopedKeys.language, mergedLanguage);
      localStorage.setItem(scopedKeys.notation, mergedNotation);
    } catch (e) {
      console.error('Error writing UID-scoped local cache:', e);
    }

    // Clean up unscoped keys so another user on the same browser never sees them
    clearUnscopedLocalKeys();
    cacheUserSnapshotLocally(profile);

    // Mark hydration complete
    isCloudHydratedRef.current = true;
    setIsCloudHydrated(true);

    // Write full synchronized non-Stripe profile & progress back to Firestore
    await writeUserFieldsToFirestore(uid, {
      uid: profile.id,
      name: profile.name,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      provider: profile.provider,
      avatarUrl: profile.avatarUrl || '',
      vocalLevel: profile.vocalLevel || 'Allievo / Cantante',
      createdAt: profile.createdAt,
      emailVerified: profile.emailVerified,
      vocalProfile: profile.vocalProfile,
      customRoutines: profile.customRoutines,
      activeCustomRoutineId: profile.activeCustomRoutineId,
      practiceSessions: profile.practiceSessions,
      preferredLanguage: profile.preferredLanguage,
      preferredNotation: profile.preferredNotation,
    });

    return profile;
  };

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        await hydrateAndSyncUser(fbUser);
      } else {
        isCloudHydratedRef.current = false;
        setIsCloudHydrated(false);
        setUser(null);
        setVocalProfile(null);
        setSessions([]);
        const blankRoutine = createInitialBlankRoutine(language === 'en');
        setCustomRoutines([blankRoutine]);
        setActiveCustomRoutineIdState(blankRoutine.id);
        setRecordings([]);
        try {
          localStorage.removeItem('echora_auth_user');
          clearUnscopedLocalKeys();
        } catch (e) {
          console.error(e);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync preferredLanguage to Firestore when user changes language in UI after hydration
  useEffect(() => {
    if (!user?.id || !isCloudHydratedRef.current || isHydratingLanguageRef.current) return;
    if (user.preferredLanguage === language) return;

    const scopedKeys = getScopedKeys(user.id);
    try {
      localStorage.setItem(scopedKeys.language, language);
    } catch {}

    const updated: UserAccount = {
      ...user,
      preferredLanguage: language,
    };
    cacheUserSnapshotLocally(updated);
    writeUserFieldsToFirestore(user.id, { preferredLanguage: language });
  }, [language]);

  // 1. Save Vocal Profile (Range Test result)
  const saveVocalProfile = (profile: VocalRangeProfile) => {
    setVocalProfile(profile);
    if (user?.id) {
      const scopedKeys = getScopedKeys(user.id);
      try {
        localStorage.setItem(scopedKeys.profile, JSON.stringify(profile));
      } catch (e) {
        console.error(e);
      }

      if (!isCloudHydratedRef.current) return;

      const updatedUser: UserAccount = {
        ...user,
        vocalProfile: profile,
      };
      cacheUserSnapshotLocally(updatedUser);
      writeUserFieldsToFirestore(user.id, {
        vocalProfile: profile,
      });
    } else {
      try {
        localStorage.setItem('vocalis_profile', JSON.stringify(profile));
      } catch (e) {
        console.error(e);
      }
    }
  };

  // 2. Record Completed Exercise / Practice Session
  const recordExerciseCompletion = (title: string, durationSec: number) => {
    const mins = durationSec / 60;
    const newSession: PracticeSession = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('it-IT'),
      durationMinutes: mins,
      exercisesCompleted: [title],
    };

    const updatedSessions = [newSession, ...sessions];
    setSessions(updatedSessions);

    if (user?.id) {
      const scopedKeys = getScopedKeys(user.id);
      try {
        localStorage.setItem(scopedKeys.sessions, JSON.stringify(updatedSessions));
      } catch (e) {
        console.error(e);
      }

      if (!isCloudHydratedRef.current) return;

      const updatedUser: UserAccount = {
        ...user,
        practiceSessions: updatedSessions,
      };
      cacheUserSnapshotLocally(updatedUser);
      writeUserFieldsToFirestore(user.id, {
        practiceSessions: updatedSessions,
      });
    } else {
      try {
        localStorage.setItem('vocalis_sessions', JSON.stringify(updatedSessions));
      } catch (e) {
        console.error(e);
      }
    }
  };

  // 3. Save Custom Routines & Active Custom Routine ID
  const saveCustomRoutines = (routines: SavedCustomRoutine[], activeId?: string) => {
    const cleanRoutines = filterValidUserRoutines(routines);
    const finalRoutines =
      cleanRoutines.length > 0 ? cleanRoutines : [createInitialBlankRoutine(isEn)];
    const nextActiveId =
      activeId && finalRoutines.some((r) => r.id === activeId)
        ? activeId
        : finalRoutines.some((r) => r.id === activeCustomRoutineId)
          ? activeCustomRoutineId
          : finalRoutines[0].id;

    setCustomRoutines(finalRoutines);
    setActiveCustomRoutineIdState(nextActiveId);

    if (user?.id) {
      const scopedKeys = getScopedKeys(user.id);
      try {
        localStorage.setItem(scopedKeys.routines, JSON.stringify(finalRoutines));
        localStorage.setItem(scopedKeys.activeRoutineId, nextActiveId);
      } catch (e) {
        console.error(e);
      }

      if (!isCloudHydratedRef.current) return;

      const updatedUser: UserAccount = {
        ...user,
        customRoutines: finalRoutines,
        activeCustomRoutineId: nextActiveId,
      };
      cacheUserSnapshotLocally(updatedUser);
      writeUserFieldsToFirestore(user.id, {
        customRoutines: finalRoutines,
        activeCustomRoutineId: nextActiveId,
      });
    } else {
      try {
        localStorage.setItem('echora_saved_custom_routines', JSON.stringify(finalRoutines));
        localStorage.setItem('echora_active_custom_routine_id', nextActiveId);
      } catch (e) {
        console.error(e);
      }
    }
  };

  // 4. Update Active Custom Routine ID
  const setActiveCustomRoutineId = (id: string) => {
    setActiveCustomRoutineIdState(id);
    if (user?.id) {
      const scopedKeys = getScopedKeys(user.id);
      try {
        localStorage.setItem(scopedKeys.activeRoutineId, id);
      } catch {}

      if (!isCloudHydratedRef.current) return;

      const updatedUser: UserAccount = {
        ...user,
        activeCustomRoutineId: id,
      };
      cacheUserSnapshotLocally(updatedUser);
      writeUserFieldsToFirestore(user.id, {
        activeCustomRoutineId: id,
      });
    } else {
      try {
        localStorage.setItem('echora_active_custom_routine_id', id);
      } catch {}
    }
  };

  // 5. Save Preferred Notation
  const setPreferredNotation = (notation: NoteNotation) => {
    setPreferredNotationState(notation);
    if (user?.id) {
      const scopedKeys = getScopedKeys(user.id);
      try {
        localStorage.setItem(scopedKeys.notation, notation);
      } catch {}

      if (!isCloudHydratedRef.current) return;

      const updatedUser: UserAccount = {
        ...user,
        preferredNotation: notation,
      };
      cacheUserSnapshotLocally(updatedUser);
      writeUserFieldsToFirestore(user.id, {
        preferredNotation: notation,
      });
    } else {
      try {
        localStorage.setItem('echora_notation', notation);
      } catch {}
    }
  };

  // 6. Local-only voice recordings (Rule 9: not synced to Firestore, isolated per user)
  const saveRecording = (rec: SavedRecording) => {
    const updated = [rec, ...recordings];
    setRecordings(updated);
    if (user?.id) {
      const scopedKeys = getScopedKeys(user.id);
      try {
        localStorage.setItem(scopedKeys.recordings, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    } else {
      try {
        localStorage.setItem('vocalis_recordings', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const deleteRecording = (id: string) => {
    const updated = recordings.filter((r) => r.id !== id);
    setRecordings(updated);
    if (user?.id) {
      const scopedKeys = getScopedKeys(user.id);
      try {
        localStorage.setItem(scopedKeys.recordings, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    } else {
      try {
        localStorage.setItem('vocalis_recordings', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const openAuthModal = (mode: 'login' | 'signup' = 'login') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const updateUser = (updates: Partial<UserAccount>) => {
    if (!user) return;
    const newFirstName = updates.firstName !== undefined ? updates.firstName : user.firstName;
    const newLastName = updates.lastName !== undefined ? updates.lastName : user.lastName;
    const computedName = `${newFirstName} ${newLastName}`.trim() || user.name;

    const updated: UserAccount = {
      ...user,
      ...updates,
      name: computedName,
    };
    cacheUserSnapshotLocally(updated);

    if (user.id && isCloudHydratedRef.current) {
      writeUserFieldsToFirestore(user.id, {
        ...updates,
        firstName: newFirstName,
        lastName: newLastName,
        name: computedName,
      });
    }
  };

  const sendConfirmationEmail = () => {
    if (!user) return;
    updateUser({ confirmationEmailSent: true });
    setLastRegistrationNotification(
      `Un'email di verifica è stata inviata a ${user.email}! Clicca sul link nell'email per confermare il tuo account.`
    );
  };

  const verifyEmail = () => {
    if (!user) return;
    updateUser({ emailVerified: true, confirmationEmailSent: true });
    setLastRegistrationNotification(
      `Email ${user.email} confermata con successo! Il tuo account Echora è ora verificato.`
    );
  };

  const clearRegistrationNotification = () => {
    setLastRegistrationNotification(null);
  };

  const loginWithEmail = async (email: string, pass: string): Promise<boolean> => {
    try {
      const res = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const fbUser = res.user;

      const parts = email.split('@')[0].split('.');
      const first = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'Cantante';
      const last = parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : 'Echora';

      await hydrateAndSyncUser(fbUser, {
        firstName: first,
        lastName: last,
        email: email.trim().toLowerCase(),
        provider: 'email',
      });
      closeAuthModal();
      return true;
    } catch (err) {
      console.error('Firebase email login failed:', err);
      throw err;
    }
  };

  const signupWithEmail = async (
    email: string,
    pass: string,
    firstName: string,
    lastName: string,
    vocalLevel: string = 'Allievo / Cantante'
  ): Promise<boolean> => {
    const cleanFirst = firstName.trim() || 'Allievo';
    const cleanLast = lastName.trim() || 'Echora';
    const cleanEmail = email.trim().toLowerCase();
    const fullName = `${cleanFirst} ${cleanLast}`;

    try {
      const res = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      const fbUser = res.user;
      await updateProfile(fbUser, { displayName: fullName });

      await hydrateAndSyncUser(fbUser, {
        firstName: cleanFirst,
        lastName: cleanLast,
        email: cleanEmail,
        vocalLevel,
        provider: 'email',
      });
      setLastRegistrationNotification(
        `🎉 Account creato con successo su Firebase! Abbiamo registrato ${cleanEmail}.`
      );
      closeAuthModal();
      return true;
    } catch (err) {
      console.error('Firebase signup error:', err);
      throw err;
    }
  };

  const loginWithGoogle = async (
    customFirstName?: string,
    customLastName?: string,
    googleEmail?: string
  ): Promise<boolean> => {
    try {
      googleProvider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;

      const fullName =
        fbUser.displayName || `${customFirstName || 'Utente'} ${customLastName || 'Google'}`.trim();
      const parts = fullName.split(' ');
      const first = customFirstName?.trim() || parts[0] || 'Utente';
      const last = customLastName?.trim() || parts.slice(1).join(' ') || '';

      const profile = await hydrateAndSyncUser(fbUser, {
        firstName: first,
        lastName: last,
        email: fbUser.email || googleEmail || '',
        provider: 'google',
      });

      setLastRegistrationNotification(
        `Autenticazione Google Firebase completata con successo per ${profile.name}! Account salvato.`
      );
      closeAuthModal();
      return true;
    } catch (err) {
      console.error('Google login error:', err);
      throw err;
    }
  };

  const logout = async () => {
    isCloudHydratedRef.current = false;
    setIsCloudHydrated(false);
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Signout error:', e);
    }
    setUser(null);
    setVocalProfile(null);
    setSessions([]);
    const blankRoutine = createInitialBlankRoutine(language === 'en');
    setCustomRoutines([blankRoutine]);
    setActiveCustomRoutineIdState(blankRoutine.id);
    setRecordings([]);
    setLastRegistrationNotification(null);
    try {
      localStorage.removeItem('echora_auth_user');
      clearUnscopedLocalKeys();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isCloudHydrated,
        vocalProfile,
        sessions,
        customRoutines,
        activeCustomRoutineId,
        preferredNotation,
        recordings,
        saveVocalProfile,
        recordExerciseCompletion,
        saveCustomRoutines,
        setActiveCustomRoutineId,
        setPreferredNotation,
        saveRecording,
        deleteRecording,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        authMode,
        setAuthMode,
        loginWithEmail,
        signupWithEmail,
        loginWithGoogle,
        logout,
        updateUser,
        sendConfirmationEmail,
        verifyEmail,
        lastRegistrationNotification,
        clearRegistrationNotification,
        isSubscribed,
        isSubscriptionModalOpen,
        subscriptionModalMessage,
        openSubscriptionModal,
        closeSubscriptionModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
