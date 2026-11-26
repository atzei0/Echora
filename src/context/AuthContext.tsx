import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db, OperationType, handleFirestoreError } from '../lib/firebase';
import {
  NoteNotation,
  PracticeSession,
  SavedCustomRoutine,
  SavedRecording,
  VocalRangeProfile,
} from '../types';
import { useLanguage } from './LanguageContext';
import { Language } from './i18n';
import {
  INPUT_LIMITS,
  ALLOWED_VOCAL_LEVELS,
  sanitizePlainText,
  isValidEmail,
  validateSignupPassword,
  validatePersonName,
  isSafeAvatarUrl,
} from '../utils/validation';

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
  cancelAtPeriodEnd?: boolean;
  pendingPlan?: string | null;
  pendingPlanAmount?: number | null;
  pendingPlanStartsAt?: string | null;
  nextChargeAmount?: number | null;
  role?: 'coach' | 'student';
  isCoach?: boolean;
}

interface ServerAuthState {
  isCoach: boolean;
  role: 'coach' | 'student';
  isSubscribed: boolean;
  subscriptionStatus: string;
  subscriptionPlan?: string;
  subscriptionPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  pendingPlan: string | null;
  pendingPlanAmount: number | null;
  pendingPlanStartsAt: string | null;
  nextChargeAmount: number | null;
}

const DEFAULT_SERVER_AUTH_STATE: ServerAuthState = {
  isCoach: false,
  role: 'student',
  isSubscribed: false,
  subscriptionStatus: 'inactive',
  cancelAtPeriodEnd: false,
  pendingPlan: null,
  pendingPlanAmount: null,
  pendingPlanStartsAt: null,
  nextChargeAmount: null,
};

interface AuthContextType {
  user: UserAccount | null;
  isCoach: boolean;
  role: 'coach' | 'student';
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
  resetPassword: (email: string) => Promise<void>;
  refreshSubscriptionStatus: (forceTokenRefresh?: boolean) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<UserAccount>) => void;
  sendConfirmationEmail: () => Promise<void>;
  verifyEmail: () => Promise<boolean>;
  lastRegistrationNotification: string | null;
  clearRegistrationNotification: () => void;
  isSubscribed: boolean;
  isSubscriptionModalOpen: boolean;
  subscriptionModalMessage: string | null;
  openSubscriptionModal: (message?: string) => void;
  closeSubscriptionModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Fields managed exclusively by the backend server (Admin SDK) and blocked from client writes
const SERVER_ONLY_USER_KEYS = new Set([
  'subscriptionStatus',
  'subscriptionPlan',
  'subscriptionPeriodEnd',
  'cancelAtPeriodEnd',
  'stripeCustomerId',
  'stripeSubscriptionId',
  'pendingPlan',
  'pendingPlanAmount',
  'pendingPlanPaymentIntentId',
  'pendingPlanStartsAt',
  'pendingPlanInvoiceItemId',
  'stripeScheduleId',
  'lastStripeEventCreated',
  'role',
  'isCoach',
  'emailVerified',
]);

// Identity fields locked on client updates in Firestore rules
const IMMUTABLE_IDENTITY_KEYS = new Set(['uid', 'email', 'createdAt']);

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

function sanitizeForFirestore(data: Record<string, any>, isInitialCreate = false): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (SERVER_ONLY_USER_KEYS.has(key)) continue;
    if (!isInitialCreate && IMMUTABLE_IDENTITY_KEYS.has(key)) continue;
    cleaned[key] = JSON.parse(JSON.stringify(value));
  }
  return cleaned;
}

/**
 * Strips privileged/authorization claims before writing any snapshot to browser storage,
 * guaranteeing localStorage cannot be tampered with to elevate privileges or spoof subscriptions.
 */
function buildSafeLocalProfileSnapshot(acc: UserAccount): Partial<UserAccount> {
  return {
    id: acc.id,
    name: acc.name,
    firstName: acc.firstName,
    lastName: acc.lastName,
    email: acc.email,
    provider: acc.provider,
    avatarUrl: acc.avatarUrl,
    vocalLevel: acc.vocalLevel,
    createdAt: acc.createdAt,
    preferredLanguage: acc.preferredLanguage,
    preferredNotation: acc.preferredNotation,
    confirmationEmailSent: acc.confirmationEmailSent,
    xp: acc.xp,
    streakDays: acc.streakDays,
  };
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
  return list
    .filter(
      (r) =>
        r &&
        typeof r.id === 'string' &&
        !r.id.startsWith('preset_') &&
        !r.id.includes('preset') &&
        Array.isArray(r.steps)
    )
    .slice(0, 50);
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

  return Array.from(map.values()).slice(0, 50);
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
          ...(item.notes ? { notes: sanitizePlainText(item.notes, 300, true) } : {}),
        });
      }
    }
  };

  addAll(cloudList);
  for (const list of localLists) {
    addAll(list);
  }

  return Array.from(map.values())
    .sort((a, b) => {
      const numA = Number(a.id);
      const numB = Number(b.id);
      if (!Number.isNaN(numA) && !Number.isNaN(numB) && numA !== numB) {
        return numB - numA;
      }
      return 0;
    })
    .slice(0, 500);
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

  // Local snapshot only provides UI profile fields (never authorization or subscription status)
  const [user, setUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('echora_auth_user');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (!parsed?.id || parsed.id.startsWith('usr_')) {
        localStorage.removeItem('echora_auth_user');
        return null;
      }
      return {
        id: String(parsed.id),
        name: sanitizePlainText(parsed.name || '', 160),
        firstName: sanitizePlainText(parsed.firstName || '', INPUT_LIMITS.NAME_MAX),
        lastName: sanitizePlainText(parsed.lastName || '', INPUT_LIMITS.NAME_MAX),
        email: sanitizePlainText(parsed.email || '', INPUT_LIMITS.EMAIL_MAX),
        provider: parsed.provider === 'google' ? 'google' : 'email',
        avatarUrl: isSafeAvatarUrl(parsed.avatarUrl) ? parsed.avatarUrl : undefined,
        vocalLevel: sanitizePlainText(parsed.vocalLevel || 'Allievo / Cantante', INPUT_LIMITS.VOCAL_LEVEL_MAX),
        createdAt: sanitizePlainText(parsed.createdAt || '', 64),
        emailVerified: false,
        confirmationEmailSent: Boolean(parsed.confirmationEmailSent),
        xp: typeof parsed.xp === 'number' ? parsed.xp : 150,
        streakDays: typeof parsed.streakDays === 'number' ? parsed.streakDays : 1,
        preferredLanguage: parsed.preferredLanguage === 'en' ? 'en' : 'it',
        preferredNotation: parsed.preferredNotation === 'scientific' ? 'scientific' : 'latin',
        role: 'student',
        isCoach: false,
        subscriptionStatus: 'inactive',
      };
    } catch {
      return null;
    }
  });

  // Authoritative server-verified state — ONLY mutated by verified `/api/subscription-status` responses
  const [serverAuthState, setServerAuthState] = useState<ServerAuthState>(DEFAULT_SERVER_AUTH_STATE);

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

  // Strictly server-verified role & subscription flags (zero client-side or localhost bypasses)
  const isCoach = serverAuthState.isCoach;
  const role: 'coach' | 'student' = serverAuthState.role;
  const isSubscribed = Boolean(serverAuthState.isCoach || serverAuthState.isSubscribed);

  const fetchVerifiedServerStatus = async (fbUser: FirebaseUser, forceRefresh = false): Promise<ServerAuthState> => {
    try {
      const idToken = await fbUser.getIdToken(forceRefresh);
      if (!idToken) {
        return DEFAULT_SERVER_AUTH_STATE;
      }
      const res = await fetch('/api/subscription-status', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });
      if (!res.ok) {
        return DEFAULT_SERVER_AUTH_STATE;
      }
      const data = await res.json();
      const verifiedCoach = Boolean(data?.isCoach === true && data?.role === 'coach');
      const status = typeof data?.subscriptionStatus === 'string' ? data.subscriptionStatus : 'inactive';
      const activePremium = Boolean(
        verifiedCoach ||
        data?.isPremium === true ||
        status === 'active' ||
        status === 'trialing'
      );
      return {
        isCoach: verifiedCoach,
        role: verifiedCoach ? 'coach' : 'student',
        isSubscribed: activePremium,
        subscriptionStatus: verifiedCoach ? 'active' : status,
        subscriptionPlan: verifiedCoach
          ? 'coach_unlimited'
          : typeof data?.subscriptionPlan === 'string'
            ? data.subscriptionPlan
            : undefined,
        subscriptionPeriodEnd: verifiedCoach
          ? '2099-12-31T23:59:59.000Z'
          : typeof data?.subscriptionPeriodEnd === 'string'
            ? data.subscriptionPeriodEnd
            : undefined,
        cancelAtPeriodEnd: verifiedCoach ? false : Boolean(data?.cancelAtPeriodEnd),
        pendingPlan: verifiedCoach
          ? null
          : typeof data?.pendingPlan === 'string'
            ? data.pendingPlan
            : null,
        pendingPlanAmount: verifiedCoach
          ? null
          : typeof data?.pendingPlanAmount === 'number'
            ? data.pendingPlanAmount
            : null,
        pendingPlanStartsAt: verifiedCoach
          ? null
          : typeof data?.pendingPlanStartsAt === 'string'
            ? data.pendingPlanStartsAt
            : null,
        nextChargeAmount: verifiedCoach
          ? null
          : typeof data?.nextChargeAmount === 'number'
            ? data.nextChargeAmount
            : null,
      };
    } catch {
      return DEFAULT_SERVER_AUTH_STATE;
    }
  };

  const refreshSubscriptionStatus = async (forceTokenRefresh = false) => {
    const fbUser = auth.currentUser;
    if (!fbUser) {
      setServerAuthState(DEFAULT_SERVER_AUTH_STATE);
      return;
    }
    const nextState = await fetchVerifiedServerStatus(fbUser, forceTokenRefresh);
    setServerAuthState(nextState);
    setUser((prev) =>
      prev
        ? {
            ...prev,
            role: nextState.role,
            isCoach: nextState.isCoach,
            emailVerified: fbUser.emailVerified,
            vocalLevel: nextState.isCoach ? 'Insegnante / Vocal Coach' : prev.vocalLevel,
            subscriptionStatus: nextState.subscriptionStatus,
            subscriptionPlan: nextState.subscriptionPlan,
            subscriptionPeriodEnd: nextState.subscriptionPeriodEnd,
            cancelAtPeriodEnd: nextState.cancelAtPeriodEnd,
            pendingPlan: nextState.pendingPlan,
            pendingPlanAmount: nextState.pendingPlanAmount,
            pendingPlanStartsAt: nextState.pendingPlanStartsAt,
            nextChargeAmount: nextState.nextChargeAmount,
          }
        : prev
    );
  };

  // Write non-privileged partial updates to Firestore `/users/{uid}`
  const writeUserFieldsToFirestore = async (
    uid: string,
    fields: Record<string, any>,
    isInitialCreate = false
  ) => {
    if (!uid || !db) return;
    try {
      const userRef = doc(db, 'users', uid);
      const payload = sanitizeForFirestore(
        {
          ...fields,
          updatedAt: new Date().toISOString(),
        },
        isInitialCreate
      );
      if (Object.keys(payload).length === 0) return;
      await setDoc(userRef, payload, isInitialCreate ? undefined : { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
    }
  };

  // Save ONLY non-privileged profile fields to localStorage cache
  const cacheUserSnapshotLocally = (acc: UserAccount) => {
    setUser(acc);
    try {
      const safeSnapshot = buildSafeLocalProfileSnapshot(acc);
      localStorage.setItem('echora_auth_user', JSON.stringify(safeSnapshot));
      if (acc.id) {
        const keys = getScopedKeys(acc.id);
        localStorage.setItem(keys.user, JSON.stringify(safeSnapshot));
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

    const lastUid = localStorage.getItem('echora_last_uid');
    const canMigrateUnscoped = !lastUid || lastUid === uid;

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

    let cloudData: Record<string, any> | null = null;
    let cloudDocExists = false;
    try {
      if (db) {
        const userRef = doc(db, 'users', uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          cloudDocExists = true;
          cloudData = snap.data();
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${uid}`);
    }

    const recordingsMap = new Map<string, SavedRecording>();
    for (const rec of [...scopedRecordings, ...legacyRecordings]) {
      if (rec && rec.id && !recordingsMap.has(rec.id)) {
        recordingsMap.set(rec.id, rec);
      }
    }
    const mergedRecordings = Array.from(recordingsMap.values());

    const mergedVocalProfile: VocalRangeProfile | null =
      cloudData?.vocalProfile || scopedProfile || legacyProfile || null;

    const mergedSessions = mergePracticeSessions(
      Array.isArray(cloudData?.practiceSessions) ? cloudData.practiceSessions : [],
      scopedSessions,
      legacySessions
    );

    const mergedRoutinesRaw = mergeCustomRoutines(
      Array.isArray(cloudData?.customRoutines) ? cloudData.customRoutines : [],
      scopedRoutines,
      legacyRoutines
    );
    const mergedRoutines =
      mergedRoutinesRaw.length > 0
        ? mergedRoutinesRaw
        : [createInitialBlankRoutine(language === 'en')];

    const candidateActiveId =
      cloudData?.activeCustomRoutineId || scopedActiveRoutineId || legacyActiveRoutineId || '';
    const mergedActiveRoutineId = mergedRoutines.some((r) => r.id === candidateActiveId)
      ? candidateActiveId
      : mergedRoutines[0]?.id || '';

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

    const isGoogle =
      hints?.provider === 'google' ||
      cloudData?.provider === 'google' ||
      fbUser.providerData.some((p) => p.providerId === 'google.com');
    const provider: 'email' | 'google' = isGoogle ? 'google' : 'email';

    const fallbackFullName =
      fbUser.displayName ||
      `${hints?.firstName || 'Utente'} ${hints?.lastName || 'Echora'}`.trim();
    const fallbackParts = fallbackFullName.split(' ');
    const firstName = sanitizePlainText(
      cloudData?.firstName || hints?.firstName || fallbackParts[0] || 'Utente',
      INPUT_LIMITS.NAME_MAX
    );
    const lastName = sanitizePlainText(
      cloudData?.lastName !== undefined
        ? cloudData.lastName
        : hints?.lastName !== undefined
          ? hints.lastName
          : fallbackParts.slice(1).join(' ') || '',
      INPUT_LIMITS.NAME_MAX
    );
    const fullName = sanitizePlainText(
      cloudData?.name || `${firstName} ${lastName}`.trim() || fallbackFullName,
      160
    );

    // Server-side cryptographic verification of subscription status & Coach authorization
    const verifiedServer = await fetchVerifiedServerStatus(fbUser, false);
    setServerAuthState(verifiedServer);

    const safeEmail = fbUser.email || cloudData?.email || hints?.email || '';
    const safeAvatar = isSafeAvatarUrl(cloudData?.avatarUrl)
      ? cloudData?.avatarUrl
      : isSafeAvatarUrl(fbUser.photoURL)
        ? fbUser.photoURL || undefined
        : undefined;

    const rawVocalLevel = cloudData?.vocalLevel || hints?.vocalLevel || 'Allievo / Cantante';
    const safeVocalLevel = verifiedServer.isCoach
      ? 'Insegnante / Vocal Coach'
      : ALLOWED_VOCAL_LEVELS.has(rawVocalLevel)
        ? rawVocalLevel
        : 'Allievo / Cantante';

    const profile: UserAccount = {
      id: uid,
      name: fullName,
      firstName,
      lastName,
      email: safeEmail,
      provider,
      avatarUrl: safeAvatar,
      vocalLevel: safeVocalLevel,
      role: verifiedServer.role,
      isCoach: verifiedServer.isCoach,
      createdAt: cloudData?.createdAt || new Date().toLocaleDateString('it-IT'),
      emailVerified: fbUser.emailVerified,
      confirmationEmailSent: Boolean(cloudData?.confirmationEmailSent ?? fbUser.emailVerified),
      xp: isGoogle ? 250 : 150,
      streakDays: isGoogle ? 2 : 1,
      vocalProfile: mergedVocalProfile,
      customRoutines: mergedRoutines,
      activeCustomRoutineId: mergedActiveRoutineId,
      practiceSessions: mergedSessions,
      preferredLanguage: mergedLanguage,
      preferredNotation: mergedNotation,
      subscriptionStatus: verifiedServer.subscriptionStatus,
      subscriptionPlan: verifiedServer.subscriptionPlan,
      subscriptionPeriodEnd: verifiedServer.subscriptionPeriodEnd,
      cancelAtPeriodEnd: verifiedServer.cancelAtPeriodEnd,
      pendingPlan: verifiedServer.pendingPlan,
      pendingPlanAmount: verifiedServer.pendingPlanAmount,
      pendingPlanStartsAt: verifiedServer.pendingPlanStartsAt,
      nextChargeAmount: verifiedServer.nextChargeAmount,
    };

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

    clearUnscopedLocalKeys();
    cacheUserSnapshotLocally(profile);

    isCloudHydratedRef.current = true;
    setIsCloudHydrated(true);

    // Sync non-privileged profile & progress fields to Firestore
    if (!cloudDocExists) {
      await writeUserFieldsToFirestore(
        uid,
        {
          uid: profile.id,
          email: fbUser.email || '',
          createdAt: profile.createdAt,
          name: profile.name,
          firstName: profile.firstName,
          lastName: profile.lastName,
          provider: profile.provider,
          avatarUrl: profile.avatarUrl || '',
          vocalLevel: profile.vocalLevel || 'Allievo / Cantante',
          vocalProfile: profile.vocalProfile,
          customRoutines: profile.customRoutines,
          activeCustomRoutineId: profile.activeCustomRoutineId,
          practiceSessions: profile.practiceSessions,
          preferredLanguage: profile.preferredLanguage,
          preferredNotation: profile.preferredNotation,
          confirmationEmailSent: profile.confirmationEmailSent,
        },
        true
      );
    } else {
      await writeUserFieldsToFirestore(
        uid,
        {
          name: profile.name,
          firstName: profile.firstName,
          lastName: profile.lastName,
          provider: profile.provider,
          avatarUrl: profile.avatarUrl || '',
          vocalLevel: profile.vocalLevel || 'Allievo / Cantante',
          vocalProfile: profile.vocalProfile,
          customRoutines: profile.customRoutines,
          activeCustomRoutineId: profile.activeCustomRoutineId,
          practiceSessions: profile.practiceSessions,
          preferredLanguage: profile.preferredLanguage,
          preferredNotation: profile.preferredNotation,
        },
        false
      );
    }

    return profile;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        await hydrateAndSyncUser(fbUser);
      } else {
        isCloudHydratedRef.current = false;
        setIsCloudHydrated(false);
        setServerAuthState(DEFAULT_SERVER_AUTH_STATE);
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

  const recordExerciseCompletion = (title: string, durationSec: number) => {
    const safeTitle = sanitizePlainText(title, 120) || 'Esercizio Vocale';
    const safeDuration = Math.max(0, Math.min(36000, Number(durationSec) || 0));
    const mins = safeDuration / 60;
    const newSession: PracticeSession = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('it-IT'),
      durationMinutes: mins,
      exercisesCompleted: [safeTitle],
    };

    const updatedSessions = [newSession, ...sessions].slice(0, 500);
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

  const setActiveCustomRoutineId = (id: string) => {
    const safeId = sanitizePlainText(id, 128);
    setActiveCustomRoutineIdState(safeId);
    if (user?.id) {
      const scopedKeys = getScopedKeys(user.id);
      try {
        localStorage.setItem(scopedKeys.activeRoutineId, safeId);
      } catch {}

      if (!isCloudHydratedRef.current) return;

      const updatedUser: UserAccount = {
        ...user,
        activeCustomRoutineId: safeId,
      };
      cacheUserSnapshotLocally(updatedUser);
      writeUserFieldsToFirestore(user.id, {
        activeCustomRoutineId: safeId,
      });
    } else {
      try {
        localStorage.setItem('echora_active_custom_routine_id', safeId);
      } catch {}
    }
  };

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

  const saveRecording = (rec: SavedRecording) => {
    const sanitizedRec: SavedRecording = {
      ...rec,
      exerciseTitle: sanitizePlainText(rec.exerciseTitle, INPUT_LIMITS.RECORDING_NAME_MAX) || 'Registrazione Canto',
      note: sanitizePlainText(rec.note || '', INPUT_LIMITS.RECORDING_NOTE_MAX, true),
    };
    const updated = [sanitizedRec, ...recordings];
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

    // Filter out privileged & immutable fields so clients can never alter role/subscription/email
    const safeUpdates: Record<string, any> = {};
    if (updates.firstName !== undefined) {
      const res = validatePersonName(updates.firstName, 'Nome');
      if (res.valid) safeUpdates.firstName = res.cleaned;
    }
    if (updates.lastName !== undefined) {
      const res = validatePersonName(updates.lastName, 'Cognome');
      if (res.valid) safeUpdates.lastName = res.cleaned;
    }
    if (updates.avatarUrl !== undefined && isSafeAvatarUrl(updates.avatarUrl)) {
      safeUpdates.avatarUrl = updates.avatarUrl;
    }
    if (updates.vocalLevel !== undefined && !serverAuthState.isCoach) {
      const lvl = sanitizePlainText(updates.vocalLevel, INPUT_LIMITS.VOCAL_LEVEL_MAX);
      if (ALLOWED_VOCAL_LEVELS.has(lvl)) {
        safeUpdates.vocalLevel = lvl;
      }
    }
    if (updates.confirmationEmailSent !== undefined) {
      safeUpdates.confirmationEmailSent = Boolean(updates.confirmationEmailSent);
    }

    const newFirstName = safeUpdates.firstName !== undefined ? safeUpdates.firstName : user.firstName;
    const newLastName = safeUpdates.lastName !== undefined ? safeUpdates.lastName : user.lastName;
    const computedName = sanitizePlainText(`${newFirstName} ${newLastName}`, 160) || user.name;

    const updated: UserAccount = {
      ...user,
      ...safeUpdates,
      firstName: newFirstName,
      lastName: newLastName,
      name: computedName,
    };
    cacheUserSnapshotLocally(updated);

    if (user.id && isCloudHydratedRef.current) {
      writeUserFieldsToFirestore(user.id, {
        ...safeUpdates,
        firstName: newFirstName,
        lastName: newLastName,
        name: computedName,
      });
    }
  };

  const sendConfirmationEmail = async () => {
    const fbUser = auth.currentUser;
    if (!fbUser || !user) return;
    if (fbUser.emailVerified) {
      setLastRegistrationNotification('Il tuo indirizzo email è già verificato.');
      return;
    }
    try {
      await sendEmailVerification(fbUser);
      updateUser({ confirmationEmailSent: true });
      setLastRegistrationNotification(
        `Email di verifica inviata a ${fbUser.email || user.email}. Clicca sul link ricevuto nella tua casella di posta e poi premi "Ho verificato".`
      );
    } catch (err: any) {
      if (err?.code === 'auth/too-many-requests') {
        setLastRegistrationNotification('Email di verifica già inviata di recente. Attendi qualche minuto prima di richiederne un\'altra.');
      } else {
        setLastRegistrationNotification('Impossibile inviare l\'email di verifica al momento. Riprova tra poco.');
      }
    }
  };

  const verifyEmail = async (): Promise<boolean> => {
    const fbUser = auth.currentUser;
    if (!fbUser || !user) return false;
    try {
      await fbUser.reload();
      if (fbUser.emailVerified) {
        await fbUser.getIdToken(true);
        await refreshSubscriptionStatus(true);
        setLastRegistrationNotification(
          `Email ${fbUser.email || user.email} verificata con successo!`
        );
        return true;
      } else {
        setLastRegistrationNotification(
          `L'email ${fbUser.email || user.email} non risulta ancora confermata. Apri il link nell'email ricevuta da Firebase e riprova.`
        );
        return false;
      }
    } catch {
      return false;
    }
  };

  const clearRegistrationNotification = () => {
    setLastRegistrationNotification(null);
  };

  const loginWithEmail = async (email: string, pass: string): Promise<boolean> => {
    const cleanEmail = sanitizePlainText(email, INPUT_LIMITS.EMAIL_MAX).toLowerCase();
    if (!isValidEmail(cleanEmail) || !pass) {
      throw new Error('Inserisci un indirizzo email e una password validi.');
    }

    try {
      const res = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      const fbUser = res.user;

      const parts = cleanEmail.split('@')[0].split('.');
      const first = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'Cantante';
      const last = parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : 'Echora';

      await hydrateAndSyncUser(fbUser, {
        firstName: first,
        lastName: last,
        email: cleanEmail,
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
    const cleanEmail = sanitizePlainText(email, INPUT_LIMITS.EMAIL_MAX).toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      throw new Error('Indirizzo email non valido.');
    }
    const passCheck = validateSignupPassword(pass);
    if (!passCheck.valid) {
      throw new Error(passCheck.error || 'Password non valida.');
    }
    const firstCheck = validatePersonName(firstName, 'Nome');
    if (!firstCheck.valid) {
      throw new Error(firstCheck.error || 'Nome non valido.');
    }
    const lastCheck = validatePersonName(lastName, 'Cognome');
    if (!lastCheck.valid) {
      throw new Error(lastCheck.error || 'Cognome non valido.');
    }

    const safeVocalLevel = ALLOWED_VOCAL_LEVELS.has(vocalLevel) ? vocalLevel : 'Allievo / Cantante';
    const fullName = `${firstCheck.cleaned} ${lastCheck.cleaned}`;

    try {
      const res = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
      const fbUser = res.user;
      await updateProfile(fbUser, { displayName: fullName });
      await sendEmailVerification(fbUser).catch(() => null);

      await hydrateAndSyncUser(fbUser, {
        firstName: firstCheck.cleaned,
        lastName: lastCheck.cleaned,
        email: cleanEmail,
        vocalLevel: safeVocalLevel,
        provider: 'email',
      });
      setLastRegistrationNotification(
        `Account creato con successo! Ti abbiamo inviato un'email di verifica all'indirizzo ${cleanEmail}.`
      );
      closeAuthModal();
      return true;
    } catch (err) {
      console.error('Firebase signup error:', err);
      throw err;
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    const cleanEmail = sanitizePlainText(email, INPUT_LIMITS.EMAIL_MAX).toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      throw new Error('Inserisci un indirizzo email valido.');
    }
    await sendPasswordResetEmail(auth, cleanEmail);
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
      const first = sanitizePlainText(customFirstName || parts[0] || 'Utente', INPUT_LIMITS.NAME_MAX);
      const last = sanitizePlainText(customLastName || parts.slice(1).join(' ') || '', INPUT_LIMITS.NAME_MAX);

      const profile = await hydrateAndSyncUser(fbUser, {
        firstName: first,
        lastName: last,
        email: fbUser.email || googleEmail || '',
        provider: 'google',
      });

      setLastRegistrationNotification(
        `Autenticazione Google completata con successo per ${profile.name}!`
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
    setServerAuthState(DEFAULT_SERVER_AUTH_STATE);
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
        isCoach,
        role,
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
        resetPassword,
        refreshSubscriptionStatus,
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
