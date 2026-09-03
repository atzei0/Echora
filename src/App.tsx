import React, { useState, useEffect } from 'react';
import { NoteNotation, PracticeSession, SavedRecording, VocalRangeProfile } from './types';
import { Navbar } from './components/Navbar';
import { StartHereView } from './components/StartHereView';
import { VocalExercisePlayer } from './components/VocalExercisePlayer';
import { VocalWorkoutView } from './components/VocalWorkoutView';
import { VocalCooldownView } from './components/VocalCooldownView';
import { PitchDetectorView } from './components/PitchDetectorView';
import { VocalRangeTester } from './components/VocalRangeTester';
import { AICoachPanel } from './components/AICoachPanel';
import { PracticeHistory } from './components/PracticeHistory';
import { AboutView } from './components/AboutView';
import { SubscriptionsView } from './components/SubscriptionsView';
import { UserProfileView } from './components/UserProfileView';
import { Sparkles } from 'lucide-react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { RoutineQueueProvider } from './context/RoutineQueueContext';
import { AuthModal } from './components/AuthModal';

interface HistoryEntry {
  tab: string;
  subTool?: 'range' | 'tuner' | 'breathing' | 'routine';
  fromLabel?: string;
}

function MainApp() {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>('start');
  const [startSubTool, setStartSubTool] = useState<'range' | 'tuner' | 'breathing' | 'routine'>('routine');
  const [navHistory, setNavHistory] = useState<HistoryEntry[]>([
    { tab: 'start', subTool: 'routine' }
  ]);
  const [notation, setNotation] = useState<NoteNotation>('latin');

  const handleNavigate = (
    targetTab: string,
    subTool?: 'range' | 'tuner' | 'breathing' | 'routine',
    fromLabel?: string
  ) => {
    if (targetTab === activeTab && (!subTool || subTool === startSubTool)) return;

    const currentEntry: HistoryEntry = {
      tab: activeTab,
      subTool: activeTab === 'start' ? startSubTool : undefined,
      fromLabel:
        fromLabel ||
        (activeTab === 'start' && startSubTool === 'routine'
          ? (language === 'en' ? 'Routine Generator' : 'Generatore di Routine')
          : undefined),
    };

    setNavHistory((prev) => [...prev, currentEntry]);
    if (subTool) {
      setStartSubTool(subTool);
    }
    setActiveTab(targetTab);

    try {
      window.history.pushState({ tab: targetTab, subTool }, '', window.location.pathname);
    } catch {
      // ignore
    }
  };

  const handleGoBack = () => {
    if (navHistory.length > 1) {
      const updated = [...navHistory];
      const previous = updated.pop()!;
      setNavHistory(updated);
      if (previous.subTool) {
        setStartSubTool(previous.subTool);
      }
      setActiveTab(previous.tab);
    } else {
      setActiveTab('start');
      setStartSubTool('routine');
    }
  };

  useEffect(() => {
    try {
      window.history.replaceState({ tab: 'start', subTool: 'routine' }, '', window.location.pathname);
    } catch {
      // ignore
    }

    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.tab) {
        setActiveTab(e.state.tab);
        if (e.state.subTool) {
          setStartSubTool(e.state.subTool);
        }
      } else {
        handleGoBack();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navHistory]);

  const lastEntry = navHistory[navHistory.length - 1];
  let backButtonLabel: string | undefined;
  if (lastEntry) {
    if (lastEntry.fromLabel) {
      backButtonLabel = `← ${lastEntry.fromLabel}`;
    } else if (lastEntry.tab === 'start') {
      backButtonLabel =
        lastEntry.subTool === 'routine'
          ? (language === 'en' ? '← Routine Generator' : '← Generatore di Routine')
          : (language === 'en' ? '← Start Here' : '← Inizia qui');
    } else if (lastEntry.tab === 'workout') {
      backButtonLabel = language === 'en' ? '← Workout' : '← Allenamento';
    } else if (lastEntry.tab === 'exercises') {
      backButtonLabel = language === 'en' ? '← Warm-up' : '← Riscaldamento';
    } else if (lastEntry.tab === 'cooldown') {
      backButtonLabel = language === 'en' ? '← Cool-down' : '← Defaticamento';
    } else if (lastEntry.tab === 'profile') {
      backButtonLabel = language === 'en' ? '← Profile' : '← Profilo';
    }
  }

  // Vocal Profile State
  const [vocalProfile, setVocalProfile] = useState<VocalRangeProfile | null>(() => {
    try {
      const saved = localStorage.getItem('vocalis_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Practice History State
  const [sessions, setSessions] = useState<PracticeSession[]>(() => {
    try {
      const saved = localStorage.getItem('vocalis_sessions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Recorded Audio Memos
  const [recordings, setRecordings] = useState<SavedRecording[]>(() => {
    try {
      const saved = localStorage.getItem('vocalis_recordings');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Derived Stats
  const totalMinutes = Math.round(
    sessions.reduce((acc, curr) => acc + curr.durationMinutes, 0)
  );
  const streak = sessions.length > 0 ? Math.min(30, Math.max(1, sessions.length)) : 1;

  // Save changes to localStorage
  const handleSaveProfile = (profile: VocalRangeProfile) => {
    setVocalProfile(profile);
    try {
      localStorage.setItem('vocalis_profile', JSON.stringify(profile));
    } catch (e) {
      console.error(e);
    }
  };

  const handleExerciseComplete = (title: string, durationSec: number) => {
    const mins = durationSec / 60;
    const newSession: PracticeSession = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('it-IT'),
      durationMinutes: mins,
      exercisesCompleted: [title],
    };

    const updated = [newSession, ...sessions];
    setSessions(updated);
    try {
      localStorage.setItem('vocalis_sessions', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveRecording = (rec: SavedRecording) => {
    const updated = [rec, ...recordings];
    setRecordings(updated);
    try {
      localStorage.setItem('vocalis_recordings', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteRecording = (id: string) => {
    const updated = recordings.filter((r) => r.id !== id);
    setRecordings(updated);
    try {
      localStorage.setItem('vocalis_recordings', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => handleNavigate(tab)}
        notation={notation}
        setNotation={setNotation}
        vocalProfile={vocalProfile}
        practiceStreak={streak}
        totalMinutes={totalMinutes}
      />

      {/* Main Tab Views */}
      <main className="flex-1">
        {activeTab === 'start' && (
          <StartHereView
            notation={notation}
            vocalProfile={vocalProfile}
            onSaveProfile={handleSaveProfile}
            onNavigate={handleNavigate}
            activeSubTool={startSubTool}
            onSubToolChange={(st) => setStartSubTool(st)}
          />
        )}

        {activeTab === 'exercises' && (
          <VocalExercisePlayer
            notation={notation}
            vocalProfile={vocalProfile}
            onExerciseComplete={handleExerciseComplete}
            allowedCategories={['SOVT', 'Vocalizzi']}
            title="Riscaldamento Vocale"
            sectionBadge="Sezione Riscaldamento"
            onNavigate={handleNavigate}
            onGoBack={handleGoBack}
            canGoBack={true}
            backButtonLabel={backButtonLabel}
          />
        )}

        {activeTab === 'workout' && (
          <VocalWorkoutView
            notation={notation}
            vocalProfile={vocalProfile}
            onExerciseComplete={handleExerciseComplete}
            onNavigate={handleNavigate}
            onGoBack={handleGoBack}
            canGoBack={true}
            backButtonLabel={backButtonLabel}
          />
        )}

        {activeTab === 'cooldown' && (
          <VocalCooldownView
            notation={notation}
            vocalProfile={vocalProfile}
            onExerciseComplete={handleExerciseComplete}
            onNavigate={handleNavigate}
            onGoBack={handleGoBack}
            canGoBack={true}
            backButtonLabel={backButtonLabel}
          />
        )}

        {activeTab === 'about' && (
          <AboutView onNavigate={(tab) => handleNavigate(tab)} />
        )}

        {activeTab === 'pricing' && (
          <SubscriptionsView onNavigate={(tab) => handleNavigate(tab)} />
        )}

        {activeTab === 'profile' && (
          <UserProfileView
            vocalProfile={vocalProfile}
            sessions={sessions}
            recordings={recordings}
            onNavigate={(tab, subTool, fromLabel) => handleNavigate(tab, subTool, fromLabel)}
          />
        )}

        {activeTab === 'tuner' && <PitchDetectorView notation={notation} />}

        {activeTab === 'range_test' && (
          <VocalRangeTester
            notation={notation}
            vocalProfile={vocalProfile}
            onSaveProfile={handleSaveProfile}
          />
        )}

        {activeTab === 'ai_coach' && <AICoachPanel vocalProfile={vocalProfile} />}

        {activeTab === 'journal' && (
          <PracticeHistory
            sessions={sessions}
            recordings={recordings}
            onSaveRecording={handleSaveRecording}
            onDeleteRecording={handleDeleteRecording}
            streak={streak}
            totalMinutes={totalMinutes}
          />
        )}
      </main>

      {/* Footer Banner */}
      <footer className="bg-slate-900 border-t border-slate-800 py-4 px-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <span className="text-slate-400 text-xs">
            <strong className="font-brand font-bold text-slate-200 tracking-wider">Echora</strong> © 2026 — {t('subTitle')}
          </span>
        </div>
      </footer>

      <AuthModal onNavigateToProfile={() => setActiveTab('profile')} />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <RoutineQueueProvider>
          <MainApp />
        </RoutineQueueProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

