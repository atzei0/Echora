import React, { useState } from 'react';
import { X, Mail, Lock, User, LogIn, UserPlus, LogOut, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  onNavigateToProfile?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onNavigateToProfile }) => {
  const {
    user,
    isAuthModalOpen,
    closeAuthModal,
    authMode,
    setAuthMode,
    loginWithEmail,
    signupWithEmail,
    loginWithGoogle,
    logout,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [vocalLevel, setVocalLevel] = useState('Allievo / Cantante');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isAuthModalOpen) return null;

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Inserisci email e password');
      return;
    }

    if (authMode === 'signup' && (!firstName.trim() || !lastName.trim())) {
      setErrorMsg('Inserisci sia il Nome che il Cognome');
      return;
    }

    setIsLoading(true);

    try {
      if (authMode === 'login') {
        await loginWithEmail(email, password);
      } else {
        await signupWithEmail(
          email,
          password,
          firstName,
          lastName,
          vocalLevel
        );
      }

      if (onNavigateToProfile) {
        onNavigateToProfile();
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Errore durante l\'autenticazione');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg('');

    try {
      await loginWithGoogle();

      if (onNavigateToProfile) {
        onNavigateToProfile();
      }
    } catch (err) {
      console.error('Errore autenticazione Google:', err);

      const error = err as { code?: string; message?: string };

      if (error.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Accesso Google annullato.');
      } else if (error.code === 'auth/popup-blocked') {
        setErrorMsg('Il browser ha bloccato la finestra Google. Consenti i popup per Echora e riprova.');
      } else if (error.code === 'auth/unauthorized-domain') {
        setErrorMsg('Questo dominio non è autorizzato da Firebase.');
      } else {
        setErrorMsg(
          error.message
            ? `Errore Google: ${error.message}`
            : 'Errore durante l\'accesso con Google.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-6">
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {user ? (
          <div className="space-y-6 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-sky-500 via-cyan-400 to-blue-600 p-1 shadow-xl shadow-sky-500/20 flex items-center justify-center text-2xl font-black text-white">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-white flex items-center justify-center gap-1.5">
                <span>{user.name}</span>

                {user.provider === 'google' && (
                  <span className="text-[10px] bg-blue-900/60 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-bold">
                    Google
                  </span>
                )}
              </h3>

              <p className="text-xs text-slate-400">{user.email}</p>

              <div className="inline-block pt-1">
                <span className="px-3 py-1 rounded-full bg-sky-950/80 border border-sky-500/30 text-sky-300 text-xs font-bold">
                  {user.vocalLevel || 'Allievo Echora'}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300 space-y-2 text-left">
              <div className="flex justify-between items-center text-slate-400">
                <span>Stato Account:</span>

                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Attivo
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-400">
                <span>Registrato il:</span>
                <span className="text-slate-200 font-medium">
                  {user.createdAt}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-red-950/80 hover:text-red-300 border border-slate-700 hover:border-red-500/40 text-slate-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Disconnettiti</span>
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setErrorMsg('');
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    authMode === 'login'
                      ? 'bg-sky-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Accedi
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setErrorMsg('');
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    authMode === 'signup'
                      ? 'bg-sky-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Crea Account
                </button>
              </div>

              <p className="text-xs text-slate-400 text-center">
                {authMode === 'login'
                  ? 'Accedi con le tue credenziali per sincronizzare i tuoi progressi vocali.'
                  : 'Crea il tuo account gratuito Echora per salvare esercizi, registrazioni e visualizzare la tua pagina profilo.'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleDirectGoogleLogin}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.29v3.15C3.26 21.3 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.29C.47 8.21 0 10.05 0 12s.47 3.79 1.29 5.42l3.99-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.58l3.99 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>

              <span>
                {isLoading ? 'Accesso con Google in corso...' : 'Continua con Google'}
              </span>
            </button>

            <div className="flex items-center space-x-2 text-[11px] text-slate-500 uppercase font-bold tracking-widest">
              <div className="flex-1 h-px bg-slate-800"></div>
              <span>Oppure con Email</span>
              <div className="flex-1 h-px bg-slate-800"></div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs text-center font-semibold">
                {errorMsg}
              </div>
            )}

            <form
              onSubmit={handleSubmitEmail}
              className="space-y-3.5 text-xs sm:text-sm"
            >
              {authMode === 'signup' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">
                        Nome
                      </label>

                      <div className="relative">
                        <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />

                        <input
                          type="text"
                          required
                          placeholder="Es. Marco"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl pl-10 pr-3 py-2.5 text-white outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1">
                        Cognome
                      </label>

                      <div className="relative">
                        <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />

                        <input
                          type="text"
                          required
                          placeholder="Es. Rossi"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl pl-10 pr-3 py-2.5 text-white outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      Percorso / Ruolo Vocale
                    </label>

                    <select
                      value={vocalLevel}
                      onChange={(e) => setVocalLevel(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-3.5 py-2.5 text-white outline-none"
                    >
                      <option value="Allievo Francesca">
                        Allievo di Francesca
                      </option>
                      <option value="Allievo Canto Moderno">
                        Allievo Canto Moderno
                      </option>
                      <option value="Cantante Autodidatta">
                        Cantante Autodidatta
                      </option>
                      <option value="Corista / Cantante Jazz">
                        Corista / Cantante Jazz
                      </option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Indirizzo Email
                </label>

                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />

                  <input
                    type="email"
                    required
                    placeholder="tua.email@esempio.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl pl-10 pr-3.5 py-2.5 text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Password
                </label>

                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />

                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl pl-10 pr-3.5 py-2.5 text-white outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all mt-2"
              >
                {isLoading ? (
                  <span className="animate-pulse">
                    Autenticazione in corso...
                  </span>
                ) : authMode === 'login' ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Accedi al tuo Account</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Crea Account Gratuito</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
