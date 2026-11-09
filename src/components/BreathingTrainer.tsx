import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Wind, Sparkles, CheckCircle2, Lightbulb, Timer, Zap, Heart } from 'lucide-react';
import { playMetronomeClick } from '../utils/audioSynth';
import { useLanguage } from '../context/LanguageContext';

export interface BreathingPattern {
  id: string;
  name: string;
  nameEn: string;
  category: 'diaphragm' | 'support' | 'calm' | 'agility';
  badge: string;
  badgeEn: string;
  description: string;
  descriptionEn: string;
  inhaleSec: number;
  holdSec: number;
  exhaleSec: number;
  restSec: number;
  exhaleSound: string;
  exhaleSoundEn: string;
  coachAdvice: string;
  coachAdviceEn: string;
}

export const BREATHING_PATTERNS: BreathingPattern[] = [
  {
    id: 'diaphragmatic_basic',
    name: '1. Respirazione Diaframmatica Base (4-4-8)',
    nameEn: '1. Diaphragmatic Breath Foundation (4-4-8)',
    category: 'diaphragm',
    badge: 'Base Tecnica',
    badgeEn: 'Foundation',
    description: 'Impara ad espandere la pancia e la fascia lombo-costale eliminando la respirazione alta/clavicolare. La base per ogni cantante.',
    descriptionEn: 'Expand belly and ribs without lifting shoulders. The core foundation for every singer.',
    inhaleSec: 4,
    holdSec: 4,
    exhaleSec: 8,
    restSec: 2,
    exhaleSound: 'Soffio continuo "Fff"',
    exhaleSoundEn: 'Steady "Fff" blow',
    coachAdvice: 'Metti una mano sull\'ombelico e una sul petto: la mano sul petto deve restare immobile, quella sull\'ombelico si muove verso l\'esterno!',
    coachAdviceEn: 'One hand on navel, one on chest: keep the chest hand still while the navel expands outward smoothly.',
  },
  {
    id: 'support_sss',
    name: '2. Sostegno e Pressione con "SSS" (3-0-12)',
    nameEn: '2. Breath Support "SSS" (3-0-12)',
    category: 'support',
    badge: 'Appoggio & Tenuta',
    badgeEn: 'Support & Stamina',
    description: 'Allena la tenuta del diaframma mantenendo le costole aperte durante l\'emissione uniforme della sibilante "S".',
    descriptionEn: 'Train lower-rib engagement by sustaining a laser-even sibilant "S" with steady abdominal support.',
    inhaleSec: 3,
    holdSec: 0,
    exhaleSec: 12,
    restSec: 2,
    exhaleSound: 'Consonante sibilante "Sss"',
    exhaleSoundEn: 'Sibilant consonant "Sss"',
    coachAdvice: 'Il suono della "S" deve essere dritto e fermo come un raggio laser, senza tremolii o cadute di volume improvvise.',
    coachAdviceEn: 'Your "S" should be as straight and unwavering as a laser beam, no dips or sudden spikes in pressure.',
  },
  {
    id: 'box_breathing',
    name: '3. Box Breathing 4-4-4-4 (Reset Pre-Concerto)',
    nameEn: '3. Box Breathing 4-4-4-4 (Pre-Performance Reset)',
    category: 'calm',
    badge: 'Anti-Ansia & Focus',
    badgeEn: 'Anti-Stage Fright',
    description: 'Ritmo geometrico a 4 fasi uguali. Abbassa istantaneamente la frequenza cardiaca e calma l\'ansia da palco prima di cantare.',
    descriptionEn: 'Equal 4-phase cadence. Instantly lowers heart rate and dissolves performance anxiety before hitting the mic.',
    inhaleSec: 4,
    holdSec: 4,
    exhaleSec: 4,
    restSec: 4,
    exhaleSound: 'Espirazione silenziosa a labbra socchiuse',
    exhaleSoundEn: 'Gentle silent exhale through pursed lips',
    coachAdvice: 'Durante i 4 secondi di apnea a polmoni vuoti, rilascia completamente spalle, lingua e mascella.',
    coachAdviceEn: 'During the 4 seconds of empty lung pause, fully drop your shoulders, tongue, and jaw.',
  },
  {
    id: 'staccato_bellows',
    name: '4. Reattività Diaframmatica a Mantice (Staccato Ts-Ts-Ts)',
    nameEn: '4. Bellows Diaphragm Agility (Staccato Ts-Ts-Ts)',
    category: 'agility',
    badge: 'Agilità & Rimbalzo',
    badgeEn: 'Agility & Bounce',
    description: 'Impulsi rapidi ed elastici del basso ventre. Sveglia i muscoli reattivi per note acute staccate e acuti brillanti.',
    descriptionEn: 'Fast elastic pulses of the lower abdomen. Awakens quick muscular recoil needed for riffs, runs, and high notes.',
    inhaleSec: 2,
    holdSec: 1,
    exhaleSec: 6,
    restSec: 2,
    exhaleSound: 'Impulsi staccati "Ts! Ts! Ts!"',
    exhaleSoundEn: 'Short staccato bursts "Ts! Ts! Ts!"',
    coachAdvice: 'Ad ogni "Ts!" l\'ombelico rientra con uno scatto elastico verso l\'interno, per poi tornare morbido subito dopo.',
    coachAdviceEn: 'With each "Ts!", snap the navel inward elastically and release it instantly like a springboard.',
  },
  {
    id: 'advanced_capacity_zzz',
    name: '5. Resistenza Polmonare & Canto "ZZZ" (4-4-16)',
    nameEn: '5. High Capacity & Sustained Note "ZZZ" (4-4-16)',
    category: 'support',
    badge: 'Resistenza Avanzata',
    badgeEn: 'Pro Stamina',
    description: 'Espansione massima e gestione millimetrica dell\'aria per sostenere frasi lunghe senza rimanere senza fiato.',
    descriptionEn: 'Maximum lung expansion and micro air control to power through long, unbroken vocal phrases.',
    inhaleSec: 4,
    holdSec: 4,
    exhaleSec: 16,
    restSec: 3,
    exhaleSound: 'Suono vibrato continuo "Zzz"',
    exhaleSoundEn: 'Continuous voiced "Zzz"',
    coachAdvice: 'Non buttare fuori tutta l\'aria nei primi secondi! Dosala come se volessi far durare una candela accesa senza spegnerla.',
    coachAdviceEn: 'Do not dump all air in the first seconds! Meter it like you are trying to keep a candle flame steady without blowing it out.',
  },
];

export const BreathingTrainer: React.FC = () => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [selectedPattern, setSelectedPattern] = useState<BreathingPattern>(BREATHING_PATTERNS[0]);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale' | 'rest'>('inhale');
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState<number>(BREATHING_PATTERNS[0].inhaleSec);
  const [completedCycles, setCompletedCycles] = useState<number>(0);
  const [audioClicksEnabled, setAudioClicksEnabled] = useState<boolean>(true);

  // Freehold Challenge stopwatch state (Sfida Tenuta Fiato "SSS")
  const [isHoldingChallenge, setIsHoldingChallenge] = useState<boolean>(false);
  const [challengeTimerSec, setChallengeTimerSec] = useState<number>(0);
  const [bestHoldSec, setBestHoldSec] = useState<number>(0);
  const challengeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setPhase('inhale');
    setPhaseSecondsLeft(selectedPattern.inhaleSec);
    setIsActive(false);
    setCompletedCycles(0);
  }, [selectedPattern]);

  useEffect(() => {
    if (!isActive) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    if (audioClicksEnabled) {
      playMetronomeClick(true, 0.4);
    }

    timerRef.current = setInterval(() => {
      setPhaseSecondsLeft((prev) => {
        if (prev <= 1) {
          // Switch phase logic
          if (phase === 'inhale') {
            if (audioClicksEnabled) playMetronomeClick(false, 0.5);
            if (selectedPattern.holdSec > 0) {
              setPhase('hold');
              return selectedPattern.holdSec;
            } else {
              setPhase('exhale');
              return selectedPattern.exhaleSec;
            }
          } else if (phase === 'hold') {
            if (audioClicksEnabled) playMetronomeClick(true, 0.6);
            setPhase('exhale');
            return selectedPattern.exhaleSec;
          } else if (phase === 'exhale') {
            if (selectedPattern.restSec > 0) {
              if (audioClicksEnabled) playMetronomeClick(false, 0.3);
              setPhase('rest');
              return selectedPattern.restSec;
            } else {
              if (audioClicksEnabled) playMetronomeClick(true, 0.5);
              setCompletedCycles((c) => c + 1);
              setPhase('inhale');
              return selectedPattern.inhaleSec;
            }
          } else {
            // Rest ended
            if (audioClicksEnabled) playMetronomeClick(true, 0.5);
            setCompletedCycles((c) => c + 1);
            setPhase('inhale');
            return selectedPattern.inhaleSec;
          }
        }
        if (audioClicksEnabled && prev <= 4) {
          playMetronomeClick(false, 0.25);
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, phase, selectedPattern, audioClicksEnabled]);

  // Handle Freehold Challenge
  const toggleHoldChallenge = () => {
    if (isHoldingChallenge) {
      // Stop
      if (challengeIntervalRef.current) clearInterval(challengeIntervalRef.current);
      setIsHoldingChallenge(false);
      if (challengeTimerSec > bestHoldSec) {
        setBestHoldSec(challengeTimerSec);
      }
    } else {
      // Start
      setChallengeTimerSec(0);
      setIsHoldingChallenge(true);
      challengeIntervalRef.current = setInterval(() => {
        setChallengeTimerSec((t) => t + 1);
      }, 1000);
    }
  };

  useEffect(() => {
    return () => {
      if (challengeIntervalRef.current) clearInterval(challengeIntervalRef.current);
    };
  }, []);

  // Phase Display Text & Color
  const phaseInfo = {
    inhale: {
      label: isEn ? 'INHALE (Nose & Belly)' : 'INSPIRA (Naso & Basso Ventre)',
      sub: isEn ? 'Belly expands softly outward, shoulders still' : 'Gonfia pancia e fianchi, spalle rilassate',
      color: 'from-cyan-500 via-sky-600 to-blue-700',
      textCol: 'text-cyan-300',
      orbScale: 'scale-125 ring-8 ring-cyan-400/40',
    },
    hold: {
      label: isEn ? 'SUSPEND (Ribs Open)' : 'TRATTIENI (Costole Aperte)',
      sub: isEn ? 'Stay suspended without locking your throat' : 'Mantieni l\'espansione senza chiudere la gola',
      color: 'from-indigo-500 via-purple-600 to-indigo-800',
      textCol: 'text-indigo-300',
      orbScale: 'scale-125 opacity-95 ring-8 ring-indigo-400/40',
    },
    exhale: {
      label: `${isEn ? 'EXHALE' : 'ESPIRA'} (${isEn ? selectedPattern.exhaleSoundEn : selectedPattern.exhaleSound})`,
      sub: isEn ? 'Steady, supported stream of air' : 'Filo continuo d\'aria supportato dall\'addome',
      color: 'from-amber-500 via-rose-600 to-pink-700',
      textCol: 'text-amber-300',
      orbScale: 'scale-75 ring-4 ring-rose-400/30',
    },
    rest: {
      label: isEn ? 'REST & RELEASE' : 'RIPOSO (Rilassa l\'Addome)',
      sub: isEn ? 'Let your body drop all tension' : 'Rilascia ogni tensione prima del prossimo respiro',
      color: 'from-slate-700 to-slate-900',
      textCol: 'text-slate-400',
      orbScale: 'scale-90 opacity-70',
    },
  }[phase];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Pattern Selection Cards Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sky-400 font-extrabold text-xs uppercase tracking-wider">
            <Wind className="w-4 h-4" />
            <span>{isEn ? 'Vocal Breathing & Appoggio' : 'Respirazione & Appoggio Vocale'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            {isEn ? 'Breathing Trainer with Visual Guide' : 'Palestra di Respirazione per Cantanti'}
          </h2>
        </div>

        {/* Audio Click toggle */}
        <button
          type="button"
          onClick={() => setAudioClicksEnabled(!audioClicksEnabled)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
            audioClicksEnabled
              ? 'bg-sky-500/20 text-sky-300 border-sky-400/50'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}
        >
          <span>{audioClicksEnabled ? (isEn ? 'Clicks ON 🔊' : 'Click Audio ON 🔊') : (isEn ? 'Clicks OFF 🔇' : 'Click Audio OFF 🔇')}</span>
        </button>
      </div>

      {/* Pattern Selection Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {BREATHING_PATTERNS.map((pattern) => {
          const isSelected = selectedPattern.id === pattern.id;
          return (
            <div
              key={pattern.id}
              onClick={() => setSelectedPattern(pattern)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                isSelected
                  ? 'bg-gradient-to-br from-indigo-950/90 to-slate-900 border-sky-400 shadow-xl shadow-sky-500/20 ring-2 ring-sky-400/40'
                  : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-sky-950 text-sky-300 border border-sky-800/80">
                    {isEn ? pattern.badgeEn : pattern.badge}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400 font-mono">
                    {pattern.inhaleSec}s - {pattern.holdSec}s - {pattern.exhaleSec}s
                  </span>
                </div>

                <h4 className={`text-sm font-black ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                  {isEn ? pattern.nameEn : pattern.name}
                </h4>

                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {isEn ? pattern.descriptionEn : pattern.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-[11px] font-mono text-cyan-300 truncate max-w-[200px]">
                  {isEn ? pattern.exhaleSoundEn : pattern.exhaleSound}
                </span>
                <span className="text-xs font-bold text-sky-400">
                  {isSelected ? (isEn ? 'Selected' : 'Attivo') : (isEn ? 'Select' : 'Scegli')}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Breathing Orb Interactive Stage */}
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-sky-400/50 rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-col items-center justify-center text-center relative overflow-hidden space-y-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4 text-sky-400" />
            <span>
              {isEn ? 'Completed cycles:' : 'Cicli completati:'}{' '}
              <strong className="text-white font-extrabold text-sm">{completedCycles}</strong>
            </span>
          </div>

          <span className="text-xs font-bold text-sky-300">
            {isEn ? selectedPattern.nameEn : selectedPattern.name}
          </span>
        </div>

        {/* Dynamic Breathing Orb */}
        <div className="relative my-4 flex items-center justify-center">
          <div
            className={`w-48 sm:w-60 h-48 sm:h-60 rounded-full bg-gradient-to-br ${phaseInfo.color} flex flex-col items-center justify-center text-white shadow-2xl transition-all duration-1000 transform ${
              isActive ? phaseInfo.orbScale : 'scale-100 shadow-sky-500/20'
            }`}
          >
            <span className="text-5xl sm:text-6xl font-black tabular-nums drop-shadow-md">
              {phaseSecondsLeft}s
            </span>
            <span className="text-xs font-extrabold uppercase tracking-widest mt-1 opacity-90 px-3 text-center">
              {phase}
            </span>
          </div>
        </div>

        {/* Phase Text & Instructions */}
        <div className="space-y-1.5 max-w-lg">
          <h3 className={`text-xl sm:text-2xl font-black ${phaseInfo.textCol}`}>
            {phaseInfo.label}
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
            {phaseInfo.sub}
          </p>
        </div>

        {/* Main Controls */}
        <div className="flex items-center gap-4 pt-2">
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={`flex items-center gap-2.5 px-8 py-3.5 rounded-2xl font-black text-sm sm:text-base shadow-xl transition-all cursor-pointer hover:scale-105 active:scale-95 ${
              isActive
                ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/30'
                : 'bg-gradient-to-r from-sky-400 via-cyan-400 to-blue-500 hover:from-sky-300 hover:to-blue-400 text-slate-950 shadow-sky-400/30'
            }`}
          >
            {isActive ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            <span>{isActive ? (isEn ? 'Pause Guide' : 'Pausa Guida') : (isEn ? 'Start Breath Trainer' : 'Avvia Respirazione')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsActive(false);
              setPhase('inhale');
              setPhaseSecondsLeft(selectedPattern.inhaleSec);
              setCompletedCycles(0);
            }}
            className="p-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl border border-slate-700 transition-colors cursor-pointer"
            title={isEn ? 'Reset' : 'Azzera'}
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {/* Vocal Coach Advice box */}
        <div className="w-full text-left p-4 sm:p-5 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs sm:text-sm flex items-start gap-3 mt-4">
          <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-black text-amber-300 uppercase text-[11px] tracking-wide block">
              {isEn ? "Francesca's Support Technique Tip:" : 'Il Segreto di Francesca sull\'Appoggio:'}
            </span>
            <p className="leading-relaxed">
              {isEn ? selectedPattern.coachAdviceEn : selectedPattern.coachAdvice}
            </p>
          </div>
        </div>
      </div>

      {/* Bonus Challenge: Sfida Tenuta del Fiato "SSS" con Cronometro */}
      <div className="bg-slate-950/90 border border-cyan-500/40 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-cyan-400 font-extrabold text-xs uppercase tracking-wider">
              <Zap className="w-4 h-4" />
              <span>{isEn ? 'Bonus Stamina Test' : 'Sfida di Resistenza "SSS"'}</span>
            </div>
            <h3 className="text-lg font-black text-white">
              {isEn ? 'Measure Your Max Exhale Duration' : 'Misura il Tuo Record di Tenuta del Fiato'}
            </h3>
            <p className="text-xs text-slate-400">
              {isEn
                ? 'Take a deep belly breath, start the timer, and sustain a steady "Sssss" until empty. Do not force tension!'
                : 'Fai un respiro profondo nella pancia, avvia il cronometro ed emetti una "Sssss" uniforme e costante finché hai aria. Senza irrigidire la gola!'}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">
              {isEn ? 'Personal Best:' : 'Tuo Record:'}
            </span>
            <span className="text-xl font-black text-cyan-300 tabular-nums">
              {bestHoldSec > 0 ? `${bestHoldSec}s` : '—'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-4 pt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-black text-white tabular-nums">
              {challengeTimerSec}
            </span>
            <span className="text-sm font-bold text-slate-400">secondi</span>
          </div>

          <button
            type="button"
            onClick={toggleHoldChallenge}
            className={`px-6 py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              isHoldingChallenge
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                : 'bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 shadow-lg shadow-cyan-500/30'
            }`}
          >
            {isHoldingChallenge ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isHoldingChallenge ? (isEn ? 'Stop & Save Record' : 'Stop & Salva Record') : (isEn ? 'Start "SSS" Test' : 'Inizia Prova "SSS"')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

