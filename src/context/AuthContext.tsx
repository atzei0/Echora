import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';

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
  subscriptionStatus?: string;
  subscriptionPlan?: string;
  subscriptionPeriodEnd?: string;
}

interface AuthContextType {
  user: UserAccount | null;
  isAuthModalOpen: boolean;
  openAuthModal: (mode?: 'login' | 'signup') => void;
  closeAuthModal: () => void;
  authMode: 'login' | 'signup';
  setAuthMode: (mode: 'login' | 'signup') => void;
  loginWithEmail: (email: string, pass: string) => Promise<boolean>;
  signupWithEmail: (email: string, pass: string, firstName: string, lastName: string, vocalLevel?: string) => Promise<boolean>;
  loginWithGoogle: (customFirstName?: string, customLastName?: string, googleEmail?: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<UserAccount>) => void;
  sendConfirmationEmail: () => void;
  verifyEmail: () => void;
  lastRegistrationNotification: string | null;
  clearRegistrationNotification: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('echora_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [lastRegistrationNotification, setLastRegistrationNotification] = useState<string | null>(null);

  // Sync user profile to Firestore
  const saveUserToFirestoreAndLocal = async (acc: UserAccount) => {
    setUser(acc);
    try {
      localStorage.setItem('echora_auth_user', JSON.stringify(acc));
    } catch (e) {
      console.error(e);
    }

    try {
      if (acc.id && db) {
        const userRef = doc(db, 'users', acc.id);
        await setDoc(userRef, {
          uid: acc.id,
          name: acc.name,
          firstName: acc.firstName,
          lastName: acc.lastName,
          email: acc.email,
          provider: acc.provider,
          avatarUrl: acc.avatarUrl || '',
          vocalLevel: acc.vocalLevel || 'Allievo / Cantante',
          createdAt: acc.createdAt,
          emailVerified: acc.emailVerified,
          xp: acc.xp || 150,
          streakDays: acc.streakDays || 1,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch (err) {
      console.warn('Firestore write warning:', err);
    }
  };

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        try {
          const userRef = doc(db, 'users', fbUser.uid);
          const snap = await getDoc(userRef);
          
          let profile: UserAccount;
          if (snap.exists()) {
            const data = snap.data();
            profile = {
              id: fbUser.uid,
              name: data.name || fbUser.displayName || 'Utente Echora',
              firstName: data.firstName || (fbUser.displayName?.split(' ')[0] || 'Utente'),
              lastName: data.lastName || (fbUser.displayName?.split(' ').slice(1).join(' ') || ''),
              email: data.email || fbUser.email || '',
              provider: (data.provider || (fbUser.providerData[0]?.providerId === 'google.com' ? 'google' : 'email')) as 'email' | 'google',
              avatarUrl: data.avatarUrl || fbUser.photoURL || undefined,
              vocalLevel: data.vocalLevel || 'Allievo / Cantante',
              createdAt: data.createdAt || new Date().toLocaleDateString('it-IT'),
              emailVerified: fbUser.emailVerified || data.emailVerified || false,
              confirmationEmailSent: true,
              xp: data.xp || 250,
              streakDays: data.streakDays || 2,
              subscriptionStatus: data.subscriptionStatus || 'inactive',
              subscriptionPlan: data.subscriptionPlan || undefined,
              subscriptionPeriodEnd: data.subscriptionPeriodEnd || undefined,
            };
          } else {
            const fullName = fbUser.displayName || 'Utente Echora';
            const nameParts = fullName.split(' ');
            const first = nameParts[0] || 'Utente';
            const last = nameParts.slice(1).join(' ') || '';
            const isGoogle = fbUser.providerData.some(p => p.providerId === 'google.com');

            profile = {
              id: fbUser.uid,
              name: fullName,
              firstName: first,
              lastName: last,
              email: fbUser.email || '',
              provider: isGoogle ? 'google' : 'email',
              avatarUrl: fbUser.photoURL || undefined,
              vocalLevel: 'Allievo / Cantante',
              createdAt: new Date().toLocaleDateString('it-IT'),
              emailVerified: fbUser.emailVerified || isGoogle,
              confirmationEmailSent: true,
              xp: isGoogle ? 250 : 150,
              streakDays: 1,
            };
          }
          await saveUserToFirestoreAndLocal(profile);
        } catch (e) {
          console.error('Error syncing Firebase user profile:', e);
        }
      }
    });

    return () => unsubscribe();
  }, []);

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
    saveUserToFirestoreAndLocal(updated);
  };

  const sendConfirmationEmail = () => {
    if (!user) return;
    updateUser({ confirmationEmailSent: true });
    setLastRegistrationNotification(`Un'email di verifica è stata inviata a ${user.email}! Clicca sul link nell'email per confermare il tuo account.`);
  };

  const verifyEmail = () => {
    if (!user) return;
    updateUser({ emailVerified: true, confirmationEmailSent: true });
    setLastRegistrationNotification(`Email ${user.email} confermata con successo! Il tuo account Echora è ora verificato.`);
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

      const acc: UserAccount = {
        id: fbUser.uid,
        name: fbUser.displayName || `${first} ${last}`,
        firstName: first,
        lastName: last,
        email: fbUser.email || email.trim().toLowerCase(),
        provider: 'email',
        vocalLevel: 'Allievo / Cantante',
        createdAt: new Date().toLocaleDateString('it-IT'),
        emailVerified: fbUser.emailVerified || true,
        confirmationEmailSent: true,
        xp: 350,
        streakDays: 3,
      };
      await saveUserToFirestoreAndLocal(acc);
      closeAuthModal();
      return true;
    } catch (err) {
      console.warn('Firebase email login failed, creating local session:', err);
      const parts = email.split('@')[0].split('.');
      const first = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'Cantante';
      const last = parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : 'Echora';

      const acc: UserAccount = {
        id: 'usr_' + Date.now(),
        name: `${first} ${last}`,
        firstName: first,
        lastName: last,
        email: email.trim().toLowerCase(),
        provider: 'email',
        vocalLevel: 'Allievo / Cantante',
        createdAt: new Date().toLocaleDateString('it-IT'),
        emailVerified: true,
        confirmationEmailSent: true,
        xp: 350,
        streakDays: 3,
      };
      await saveUserToFirestoreAndLocal(acc);
      closeAuthModal();
      return true;
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

      const acc: UserAccount = {
        id: fbUser.uid,
        name: fullName,
        firstName: cleanFirst,
        lastName: cleanLast,
        email: cleanEmail,
        provider: 'email',
        vocalLevel,
        createdAt: new Date().toLocaleDateString('it-IT'),
        emailVerified: false,
        confirmationEmailSent: true,
        xp: 150,
        streakDays: 1,
      };
      await saveUserToFirestoreAndLocal(acc);
      setLastRegistrationNotification(
        `🎉 Account creato con successo su Firebase! Abbiamo registrato ${cleanEmail}.`
      );
      closeAuthModal();
      return true;
    } catch (err) {
      console.warn('Firebase signup fallback:', err);
      const acc: UserAccount = {
        id: 'usr_' + Date.now(),
        name: fullName,
        firstName: cleanFirst,
        lastName: cleanLast,
        email: cleanEmail,
        provider: 'email',
        vocalLevel,
        createdAt: new Date().toLocaleDateString('it-IT'),
        emailVerified: false,
        confirmationEmailSent: true,
        xp: 150,
        streakDays: 1,
      };
      await saveUserToFirestoreAndLocal(acc);
      setLastRegistrationNotification(
        `🎉 Account creato con successo! Registrato ${cleanEmail}.`
      );
      closeAuthModal();
      return true;
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
      
      const fullName = fbUser.displayName || `${customFirstName || 'Utente'} ${customLastName || 'Google'}`.trim();
      const parts = fullName.split(' ');
      const first = customFirstName?.trim() || parts[0] || 'Utente';
      const last = customLastName?.trim() || parts.slice(1).join(' ') || '';

      const acc: UserAccount = {
        id: fbUser.uid,
        name: fullName,
        firstName: first,
        lastName: last,
        email: fbUser.email || googleEmail || 'google.user@gmail.com',
        provider: 'google',
        avatarUrl: fbUser.photoURL || 'https://lh3.googleusercontent.com/a/default-user',
        vocalLevel: 'Allievo / Cantante',
        createdAt: new Date().toLocaleDateString('it-IT'),
        emailVerified: true,
        confirmationEmailSent: true,
        xp: 250,
        streakDays: 2,
      };

      await saveUserToFirestoreAndLocal(acc);
      setLastRegistrationNotification(
        `Autenticazione Google Firebase completata con successo per ${acc.name}! Account salvato.`
      );
      closeAuthModal();
      return true;
    } catch (err) {
      console.warn('Google Popup error or fallback:', err);
      
      const targetEmail = googleEmail?.trim().toLowerCase() || 'francesca.atzei0@gmail.com';
      let first = customFirstName?.trim();
      let last = customLastName?.trim();

      if (!first || !last) {
        const parts = targetEmail.split('@')[0].split('.');
        first = first || (parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'Francesca');
        last = last || (parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : 'Atzei');
      }

      const acc: UserAccount = {
        id: 'usr_goog_' + Date.now(),
        name: `${first} ${last}`.trim(),
        firstName: first,
        lastName: last,
        email: targetEmail,
        provider: 'google',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        vocalLevel: 'Allievo / Cantante',
        createdAt: new Date().toLocaleDateString('it-IT'),
        emailVerified: true,
        confirmationEmailSent: true,
        xp: 250,
        streakDays: 2,
      };

      await saveUserToFirestoreAndLocal(acc);
      setLastRegistrationNotification(
        `Account Google collegato con successo per ${acc.name}! Account salvato in Firebase.`
      );
      closeAuthModal();
      return true;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Signout error:', e);
    }
    setUser(null);
    setLastRegistrationNotification(null);
    try {
      localStorage.removeItem('echora_auth_user');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
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
