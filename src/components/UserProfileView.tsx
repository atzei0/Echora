import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Flame, Trophy, Award, CheckCircle2, ShieldCheck, 
  Sparkles, Calendar, Edit2, Save, X, ArrowRight, Zap, Music, 
  Clock, Mic, RefreshCw, Send, Check, LogOut, Inbox, Camera, Upload,
  Play, Sliders, ExternalLink, Plus, FolderOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { VocalRangeProfile, PracticeSession, SavedRecording } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useRoutineQueue, RoutineQueueItem } from '../context/RoutineQueueContext';
import { SimulatedInboxModal } from './SimulatedInboxModal';

interface SavedCustomRoutine {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  steps: any[];
}

interface UserProfileViewProps {
  vocalProfile: VocalRangeProfile | null;
  sessions: PracticeSession[];
  recordings: SavedRecording[];
  onNavigate: (tab: string, subTool?: 'range' | 'tuner' | 'breathing' | 'routine', fromLabel?: string) => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  vocalProfile,
  sessions,
  recordings,
  onNavigate,
}) => {
  const { 
    user, 
    updateUser, 
    sendConfirmationEmail, 
    verifyEmail,
    lastRegistrationNotification,
    clearRegistrationNotification,
    logout,
  } = useAuth();
  
  const { language, t } = useLanguage();
  const isEn = language === 'en';
  const { startRoutineQueue } = useRoutineQueue();

  // Load custom routines saved in localStorage (strictly user-created routines)
  const [customRoutines, setCustomRoutines] = useState<SavedCustomRoutine[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('echora_saved_custom_routines');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setCustomRoutines(
            parsed.filter(
              (r) => r.steps && r.steps.length > 0 && !r.id.startsWith('preset_') && !r.id.includes('preset')
            )
          );
        }
      }
    } catch (e) {
      console.error('Error loading custom routines in profile:', e);
    }
  }, []);

  const handleLaunchCustomRoutine = (routine: SavedCustomRoutine) => {
    if (!routine.steps || routine.steps.length === 0) {
      onNavigate('start', 'routine', isEn ? 'User Profile' : 'Profilo Utente');
      return;
    }

    const queueSteps: RoutineQueueItem[] = routine.steps.map((s) => ({
      id: s.id,
      title: s.title,
      duration: '',
      vowel: s.vowel || 'A',
      focus: s.category || 'Allenamento',
      category: s.category || 'Allenamento',
      scalePattern: s.scalePattern || 'five_notes',
      exerciseId: s.exerciseId,
      targetTab: s.targetTab || 'workout',
      bpm: s.bpm || 120,
      items: [`Suono: ${s.vowel}`, `Tempo: ${s.bpm} BPM`, `Categoria: ${s.category}`],
    }));

    startRoutineQueue(routine.name, isEn ? 'Custom' : 'Personalizzata', queueSteps, 0);
    const targetTab = queueSteps[0]?.targetTab || 'exercises';
    onNavigate(targetTab, 'routine', isEn ? 'User Profile' : 'Profilo Utente');
  };

  // Modal and edit form state
  const [isInboxModalOpen, setIsInboxModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFirstName, setEditFirstName] = useState(user?.firstName || '');
  const [editLastName, setEditLastName] = useState(user?.lastName || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editVocalLevel, setEditVocalLevel] = useState(user?.vocalLevel || 'Allievo / Cantante');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  const handleOpenCustomerPortal = async () => {
    if (!user?.id) return;
    setLoadingPortal(true);
    setPortalError(null);
    try {
      const res = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Impossibile accedere al Customer Portal');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error('Errore Customer Portal:', err);
      setPortalError(err.message || 'Errore durante l\'apertura del portal di gestione abbonamento.');
    } finally {
      setLoadingPortal(false);
    }
  };

  const presetAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
  ];

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Seleziona un\'immagine inferiore a 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      updateUser({ avatarUrl: base64 });
      setSaveSuccessMsg('Foto profilo aggiornata con successo!');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    };
    reader.readAsDataURL(file);
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
          <User className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white">Nessun Account Connesso</h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Crea un account o accedi con Google per registrare i tuoi progressi, tracciare i giorni di seguito e sbloccare tutti gli achievement vocali.
          </p>
        </div>
      </div>
    );
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      firstName: editFirstName.trim(),
      lastName: editLastName.trim(),
      email: editEmail.trim(),
      vocalLevel: editVocalLevel,
    });
    setIsEditing(false);
    setSaveSuccessMsg('Profilo aggiornato con successo!');
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  // Calculate Gamification Stats
  const totalMinutes = Math.round(sessions.reduce((acc, s) => acc + s.durationMinutes, 0));
  const totalExercises = sessions.length;
  const totalRecordings = recordings.length;
  
  // Calculate XP & Level
  const calculatedXP = (user.xp || 150) + (totalMinutes * 10) + (totalExercises * 25) + (vocalProfile ? 100 : 0) + (totalRecordings * 20);
  const userLevel = Math.floor(calculatedXP / 250) + 1;
  const currentLevelXP = calculatedXP % 250;
  const nextLevelXP = 250;
  const progressPercent = Math.min(100, Math.round((currentLevelXP / nextLevelXP) * 100));

  // Days streak calculation
  const streakDays = Math.max(user.streakDays || 1, sessions.length > 0 ? Math.min(30, sessions.length) : 1);

  // Gamification Badges definition
  const badges = [
    {
      id: 'first_step',
      title: 'Primo Vocalizzo',
      titleEn: 'First Vocalise',
      description: 'Completa il tuo primo esercizio di riscaldamento.',
      descriptionEn: 'Complete your first warmup exercise.',
      icon: Music,
      color: 'from-sky-500 to-blue-600',
      unlocked: totalExercises >= 1,
      progress: Math.min(100, (totalExercises / 1) * 100),
    },
    {
      id: 'streak_3',
      title: 'Costanza d\'Acciaio',
      titleEn: 'Iron Consistency',
      description: 'Mantieni una serie di 3 giorni di seguito di allenamento.',
      descriptionEn: 'Maintain a 3-day workout streak.',
      icon: Flame,
      color: 'from-sky-400 to-cyan-500',
      unlocked: streakDays >= 3,
      progress: Math.min(100, (streakDays / 3) * 100),
    },
    {
      id: 'streak_7',
      title: 'Settimana di Fuoco',
      titleEn: 'Fire Week',
      description: 'Allenati per 7 giorni consecutivi senza interrompere la serie!',
      descriptionEn: 'Train for 7 consecutive days without breaking the streak!',
      icon: Zap,
      color: 'from-blue-500 to-indigo-600',
      unlocked: streakDays >= 7,
      progress: Math.min(100, (streakDays / 7) * 100),
    },
    {
      id: 'range_tester',
      title: 'Esploratore dell\'Estensione',
      titleEn: 'Range Explorer',
      description: 'Esegui il test completo dell\'estensione vocale.',
      descriptionEn: 'Complete the vocal range test.',
      icon: Mic,
      color: 'from-cyan-500 to-blue-500',
      unlocked: !!vocalProfile,
      progress: vocalProfile ? 100 : 0,
    },
    {
      id: 'high_pitch_gain',
      title: 'Ascesa agli Acuti',
      titleEn: 'High Note Rise',
      description: 'Raggiungi una nota acuta superiore a Sol4/G4.',
      descriptionEn: 'Reach a high note above G4.',
      icon: Trophy,
      color: 'from-sky-500 to-indigo-600',
      unlocked: vocalProfile ? vocalProfile.highestMidi >= 67 : false,
      progress: vocalProfile ? Math.min(100, ((vocalProfile.highestMidi - 55) / 12) * 100) : 0,
    },
    {
      id: 'voice_memos',
      title: 'Diario Vocale',
      titleEn: 'Voice Memo Journal',
      description: 'Registra e salva almeno 2 memo vocali.',
      descriptionEn: 'Record and save at least 2 voice memos.',
      icon: Award,
      color: 'from-blue-400 to-sky-600',
      unlocked: totalRecordings >= 2,
      progress: Math.min(100, (totalRecordings / 2) * 100),
    },
    {
      id: 'practice_30m',
      title: 'Cantante Seriale',
      titleEn: 'Serial Singer',
      description: 'Accumula almeno 30 minuti totali di riscaldamento.',
      descriptionEn: 'Accumulate at least 30 total minutes of warmup.',
      icon: Clock,
      color: 'from-cyan-400 to-teal-500',
      unlocked: totalMinutes >= 15,
      progress: Math.min(100, (totalMinutes / 15) * 100),
    },
  ];

  const unlockedCount = badges.filter(b => b.unlocked).length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 space-y-10">
      
      {/* Registration / Email Confirmation Notification Banner */}
      {lastRegistrationNotification && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950 via-slate-900 to-blue-950 border border-sky-500/50 text-sky-100 flex items-start sm:items-center justify-between gap-3 shadow-xl animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-300 shrink-0">
              <Mail className="w-5 h-5 animate-bounce" />
            </div>
            <p className="text-xs sm:text-sm font-medium leading-relaxed">
              {lastRegistrationNotification}
            </p>
          </div>
          <button
            onClick={clearRegistrationNotification}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {saveSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs text-center font-bold">
          {saveSuccessMsg}
        </div>
      )}

      {/* Main Profile Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 relative z-10">
          {/* Left: User Avatar & Main Info */}
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-sky-500 via-cyan-400 to-blue-600 p-1 shadow-2xl shadow-sky-500/20 flex items-center justify-center shrink-0 overflow-hidden relative">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-3xl font-black text-slate-950">
                    {user.firstName ? user.firstName.charAt(0).toUpperCase() : user.name.charAt(0).toUpperCase()}
                  </span>
                )}
                
                {/* Upload Overlay */}
                <label 
                  htmlFor="avatar-file-input" 
                  className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center text-white text-[11px] font-extrabold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full"
                  title="Clicca per caricare una foto dal tuo dispositivo"
                >
                  <Camera className="w-5 h-5 text-sky-400 mb-0.5" />
                  <span>Cambia Foto</span>
                </label>
              </div>

              <input 
                id="avatar-file-input"
                type="file" 
                accept="image/*" 
                onChange={handleAvatarFileChange} 
                className="hidden" 
              />

              <div className="absolute -bottom-1 -right-1 p-2 rounded-full bg-slate-900 border border-slate-700 shadow-md text-sky-400" title={`Livello ${userLevel}`}>
                <Trophy className="w-4 h-4 fill-sky-400/20" />
              </div>
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-black text-white">{user.name}</h1>
              
              <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1.5 pt-0.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>{user.email}</span>
              </p>
            </div>
          </div>

          {/* Right: Quick Actions & Edit Trigger */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-center md:justify-end">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-extrabold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-sky-400" />
              <span>{isEditing ? 'Annulla' : 'Modifica Profilo'}</span>
            </button>

            <button
              onClick={() => onNavigate('pricing')}
              className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-300 hover:to-blue-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-lg cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950" />
              <span>Abbonamento</span>
            </button>
          </div>
        </div>

        {/* Inline Edit Form Modal / Accordion */}
        {isEditing && (
          <form onSubmit={handleSaveProfile} className="mt-6 pt-6 border-t border-slate-800 space-y-5 bg-slate-950/60 p-5 sm:p-6 rounded-2xl">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <User className="w-4 h-4 text-sky-400" /> Modifica dati profilo e Foto
            </h3>

            {/* Avatar Selector in Edit Form */}
            <div className="space-y-2">
              <label className="block text-slate-400 font-bold text-xs">Foto Profilo</label>
              <div className="flex flex-wrap items-center gap-3">
                <label 
                  htmlFor="avatar-file-input-edit"
                  className="px-3.5 py-2 rounded-xl bg-sky-950/80 border border-sky-500/40 text-sky-200 hover:bg-sky-900 text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Upload className="w-4 h-4 text-sky-400" /> Carica Immagine
                </label>
                <input 
                  id="avatar-file-input-edit"
                  type="file" 
                  accept="image/*" 
                  onChange={handleAvatarFileChange} 
                  className="hidden" 
                />

                <span className="text-[11px] text-slate-500">oppure scegli un avatar:</span>

                <div className="flex items-center gap-2 overflow-x-auto py-1">
                  {presetAvatars.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => updateUser({ avatarUrl: url })}
                      className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-transform hover:scale-110 cursor-pointer ${
                        user.avatarUrl === url ? 'border-sky-400 ring-2 ring-sky-400/50' : 'border-slate-700 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Nome</label>
                <input
                  type="text"
                  required
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Cognome</label>
                <input
                  type="text"
                  required
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-white outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Annulla
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
              >
                <Save className="w-3.5 h-3.5" /> Salva Modifiche
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Stripe Customer Portal & Subscription Card */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-300 text-[10px] font-black uppercase tracking-wider mb-1 border border-sky-500/20">
                <span>Stato Abbonamento Stripe</span>
              </div>
              <h3 className="text-lg font-black text-white">
                {user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing' ? (
                  <span className="text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 inline" /> Echora Pro Attivo ({user.subscriptionPlan || 'Mensile'})
                  </span>
                ) : user.subscriptionStatus === 'canceled' ? (
                  <span className="text-amber-400">Abbonamento Annullato</span>
                ) : (
                  <span className="text-slate-300">Nessun Abbonamento Attivo</span>
                )}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {user.subscriptionPeriodEnd 
                  ? `Valido fino al ${new Date(user.subscriptionPeriodEnd).toLocaleDateString('it-IT')}`
                  : 'Sblocca tutti i riscaldamenti vocali, il pitch detector e l\'AI Coach attivati 24/7'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleOpenCustomerPortal}
              disabled={loadingPortal}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loadingPortal ? (
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-slate-950" />
                  <span>Gestisci Abbonamento (Stripe Portal)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {portalError && (
          <p className="text-xs text-red-400 font-medium pt-2 border-t border-slate-800">
            {portalError}
          </p>
        )}
      </div>

      {/* Section Header: Monitora i tuoi progressi */}
      <div className="pt-2 pb-1 space-y-1">
        <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-sky-400" />
          <span>Monitora i tuoi progressi</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          I tuoi traguardi, la continuità negli allenamenti e le statistiche vocali.
        </p>
      </div>

      {/* Gamification Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* 1. Level & XP Progress Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Livello Vocale</h3>
                <p className="text-lg font-black text-white">Livello {userLevel}</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-slate-800 text-sky-300 text-xs font-extrabold border border-slate-700">
              {calculatedXP} XP
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400 font-semibold">
              <span>Prossimo Livello</span>
              <span>{currentLevelXP} / {nextLevelXP} XP</span>
            </div>
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-blue-500 transition-all duration-1000"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Completa vocalizzi, esercizi di respirazione e test dell'estensione per guadagnare punti XP!
            </p>
          </div>
        </div>

        {/* 2. Giorni di Fila (Streak Counter) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                <Flame className="w-5 h-5 fill-sky-400" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Giorni di Fila</h3>
                <p className="text-lg font-black text-white">{streakDays} Giorni Consecutivi</p>
              </div>
            </div>
          </div>

          {/* Weekday indicators */}
          <div className="space-y-1.5">
            <div className="grid grid-cols-7 gap-1 text-center">
              {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((day, idx) => {
                const isActive = idx < streakDays;
                return (
                  <div key={idx} className="space-y-1">
                    <div className={`py-1.5 rounded-xl text-xs font-black transition-all ${
                      isActive 
                        ? 'bg-gradient-to-b from-sky-400 to-blue-600 text-slate-950 shadow-md scale-105'
                        : 'bg-slate-950 text-slate-600 border border-slate-800'
                    }`}>
                      {day}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 text-center pt-1">
              Continua ad allenarti ogni giorno per non azzerare la tua serie!
            </p>
          </div>
        </div>

        {/* 3. Overall Activity Summary */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Attività Totale</h3>
                <p className="text-lg font-black text-white">{totalMinutes} min di canto</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-2xl font-black text-sky-400">{totalExercises}</span>
              <p className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">Esercizi Fatti</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-2xl font-black text-sky-400">{totalRecordings}</span>
              <p className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">Memo Audio</p>
            </div>
          </div>
        </div>

      </div>

      {/* Custom Routines Shortcut Section */}
      <div className="bg-slate-900/90 border border-sky-400/50 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-sky-500/20 shrink-0">
              <Sliders className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <span>{isEn ? 'My Custom Routines' : 'Le Mie Routine Personalizzate'}</span>
                <span className="text-xs font-extrabold text-sky-400 bg-sky-950/80 px-2.5 py-0.5 rounded-full border border-sky-800/80">
                  {customRoutines.length} {isEn ? 'created' : 'create'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {isEn
                  ? 'Your personalized exercise sequences ready to play in one click.'
                  : 'I tuoi programmi di allenamento creati nel costruttore, pronti per essere avviati in sequenza con 1 click.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('start', 'routine', isEn ? 'User Profile' : 'Profilo Utente')}
            className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sky-300 hover:text-white font-black text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md self-start sm:self-auto hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4 text-sky-400" />
            <span>{isEn ? 'Open Routine Builder' : 'Costruisci Nuova Routine'}</span>
          </button>
        </div>

        {customRoutines.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customRoutines.map((routine) => {
              const totalMins = (routine.steps || []).reduce((acc: number, s: any) => acc + (s.durationMinutes || 3), 0);
              const categories = Array.from(new Set((routine.steps || []).map((s: any) => s.category).filter(Boolean)));

              return (
                <div
                  key={routine.id}
                  className="bg-slate-950/90 border border-slate-800 hover:border-sky-500/50 rounded-2xl p-5 transition-all space-y-4 shadow-lg flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-sky-400 shrink-0" />
                        <span>{routine.name}</span>
                      </h3>
                      <span className="text-[11px] font-black text-sky-300 bg-sky-950/80 px-2 py-0.5 rounded-md border border-sky-800 shrink-0">
                        {routine.steps?.length || 0} {isEn ? 'exercises' : 'esercizi'}
                      </span>
                    </div>

                    {routine.description && (
                      <p className="text-xs text-slate-400 line-clamp-2">{routine.description}</p>
                    )}

                    {/* Exercise Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(routine.steps || []).slice(0, 4).map((step: any, idx: number) => (
                        <span
                          key={idx}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 border border-slate-800 truncate max-w-[140px]"
                        >
                          {idx + 1}. {step.title}
                        </span>
                      ))}
                      {(routine.steps || []).length > 4 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-900 text-slate-400 border border-slate-800">
                          +{(routine.steps || []).length - 4} altri
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => handleLaunchCustomRoutine(routine)}
                      className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-sky-500/20 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5 fill-slate-950" />
                      <span>{isEn ? 'Start Routine' : 'Avvia Routine'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        try {
                          localStorage.setItem('echora_active_custom_routine_id', routine.id);
                        } catch {}
                        onNavigate('start', 'routine', isEn ? 'User Profile' : 'Profilo Utente');
                      }}
                      className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                      title={isEn ? 'Edit in Builder' : 'Modifica nel Costruttore'}
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{isEn ? 'Edit' : 'Modifica'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 sm:p-8 rounded-2xl bg-slate-950/70 border border-dashed border-sky-500/30 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
              <Sliders className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h4 className="text-sm sm:text-base font-extrabold text-white">
                {isEn ? 'No custom routines created yet' : 'Non hai ancora creato una routine personalizzata'}
              </h4>
              <p className="text-xs text-slate-400">
                {isEn
                  ? 'Build your sequence in the Routine Builder to save your favorite exercises and access them directly from your profile.'
                  : 'Componi la tua sequenza ideale nel Costruttore di Routine: una volta salvata, la troverai come scorciatoia rapida sempre qui nel tuo profilo.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('start', 'routine', isEn ? 'User Profile' : 'Profilo Utente')}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-slate-950 font-black text-xs inline-flex items-center gap-2 shadow-lg shadow-sky-500/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>{isEn ? 'Create Your Routine Now' : 'Costruisci la tua Routine Ora'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Vocal Range Progress & High Note Gain Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Mic className="w-5 h-5 text-sky-400" /> Progressi Estensione Vocale
            </h2>
            <p className="text-xs text-slate-400">
              Mappa la tua estensione per verificare se sei riuscito a salire negli acuti e ampliare la tua gamma.
            </p>
          </div>

          <button
            onClick={() => onNavigate('range_test')}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Fai Test Estensione</span>
          </button>
        </div>

        {vocalProfile ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="p-5 rounded-2xl bg-slate-950 border border-sky-500/30 text-center space-y-1">
              <span className="text-xs text-sky-300 uppercase font-bold tracking-wider">Registro Vocale</span>
              <p className="text-2xl font-black text-white">{vocalProfile.voiceCategory}</p>
              <p className="text-xs text-slate-400">{vocalProfile.totalSemitones} semitoni totali</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1">
              <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Nota Più Bassa - Più Alta</span>
              <p className="text-2xl font-black text-sky-400">
                {vocalProfile.lowestNote} → {vocalProfile.highestNote}
              </p>
              <p className="text-xs text-sky-400 font-bold flex items-center justify-center gap-1">
                <Check className="w-3.5 h-3.5" /> +2 Semitoni guadagnati negli acuti!
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2">
              <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Ultimo Test</span>
              <p className="text-sm font-bold text-slate-200">{vocalProfile.testedAt}</p>
              <button
                onClick={() => onNavigate('range_test')}
                className="text-xs text-sky-400 hover:text-sky-300 font-bold underline"
              >
                Visualizza dettagli sulla tastiera →
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-slate-950 border border-dashed border-slate-800 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-sky-950/60 text-sky-400 flex items-center justify-center">
              <Mic className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-extrabold text-white">Non hai ancora mappato la tua estensione vocale</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Esegui il test interattivo di 2 minuti per scoprire il tuo tipo di voce (Soprano, Tenore, Baritono) e salvare la tua estensione.
              </p>
            </div>
            <button
              onClick={() => onNavigate('range_test')}
              className="px-5 py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs inline-flex items-center gap-2 transition-all shadow-md cursor-pointer"
            >
              <span>Avvia Test Ora</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Achievements & Badges Grid (Gamification) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-sky-400" /> Achievements e Trofei Sbloccati
            </h2>
            <p className="text-xs text-slate-400">
              Sblocca tutti i trofei completando esercizi, registrando le tue performance e mantenendo la tua serie di giorni.
            </p>
          </div>

          <span className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 text-xs font-black">
            {unlockedCount} / {badges.length} Sbloccati
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.map((badge) => {
            const Icon = badge.icon;
            return (
              <div
                key={badge.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 relative overflow-hidden ${
                  badge.unlocked
                    ? 'bg-slate-900 border-sky-500/40 shadow-xl shadow-sky-500/5 hover:border-sky-400'
                    : 'bg-slate-950/60 border-slate-800/80 opacity-70 hover:opacity-90'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${badge.color} p-3 flex items-center justify-center text-slate-950 shadow-md shrink-0`}>
                    <Icon className="w-6 h-6 stroke-[2.5]" />
                  </div>

                  {badge.unlocked ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-sky-400" /> Sbloccato
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold">
                      Bloccato
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-black text-white">{badge.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{badge.description}</p>
                </div>

                {/* Progress bar for locked badges */}
                {!badge.unlocked && (
                  <div className="space-y-1 pt-2 border-t border-slate-800/60">
                    <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                      <span>Avanzamento</span>
                      <span>{Math.round(badge.progress)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                      <div 
                        className="h-full rounded-full bg-slate-600 transition-all"
                        style={{ width: `${badge.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <SimulatedInboxModal
        isOpen={isInboxModalOpen}
        onClose={() => setIsInboxModalOpen(false)}
      />

    </div>
  );
};
