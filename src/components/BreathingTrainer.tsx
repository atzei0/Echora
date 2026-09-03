import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Wind, Sparkles, CheckCircle2 } from 'lucide-react';
import { playMetronomeClick } from '../utils/audioSynth';

interface BreathingPattern {
  id: string;
  name: string;
  description: string;
  inhaleSec: number;
  holdSec: number;
  exhaleSec: number;
  restSec: number;
  exhaleSound: string;
}

const PATTERNS: BreathingPattern[] = [
  {
    id: 'diaphragmatic_basic',
    name: 'Respirazione Diaframmatica Base (4-4-8)',
    description: 'Impara ad espandere la fascia addominale e lombo-costale eliminando la respirazione clavicolare.',
    inhaleSec: 4,
    holdSec: 4,
    exhaleSec: 8,
    restSec: 2,
    exhaleSound: 'Soffio fluido "Fff"',
  },
  {
    id: 'support_sss',
    name: 'Sostegno del Fiato "SSS" (3-0-12)',
    description: 'Allena la tenuta del diaframma mantenendo le costole aperte durante l\'emissione della sibilante.',
    inhaleSec: 3,
    holdSec: 0,
    exhaleSec: 12,
    restSec: 2,
    exhaleSound: 'Consonante sibilante "Sss"',
  },
  {
    id: 'advanced_capacity',
    name: 'Capienza e Pressione Vocale (4-4-16)',
    description: 'Espande la capacità polmonare per sostenere frasi musicali lunghe senza spezzare il canto.',
    inhaleSec: 4,
    holdSec: 4,
    exhaleSec: 16,
    restSec: 3,
    exhaleSound: 'Suono continuo "Zzz"',
  },
];

export const BreathingTrainer: React.FC = () => {
  const [selectedPattern, setSelectedPattern] = useState<BreathingPattern>(PATTERNS[0]);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale' | 'rest'>('inhale');
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState<number>(PATTERNS[0].inhaleSec);
  const [completedCycles, setCompletedCycles] = useState<number>(0);

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

    playMetronomeClick(true);

    timerRef.current = setInterval(() => {
      setPhaseSecondsLeft((prev) => {
        if (prev <= 1) {
          // Switch phase logic
          if (phase === 'inhale') {
            if (selectedPattern.holdSec > 0) {
              setPhase('hold');
              return selectedPattern.holdSec;
            } else {
              setPhase('exhale');
              return selectedPattern.exhaleSec;
            }
          } else if (phase === 'hold') {
            setPhase('exhale');
            return selectedPattern.exhaleSec;
          } else if (phase === 'exhale') {
            if (selectedPattern.restSec > 0) {
              setPhase('rest');
              return selectedPattern.restSec;
            } else {
              setCompletedCycles((c) => c + 1);
              setPhase('inhale');
              return selectedPattern.inhaleSec;
            }
          } else {
            // Rest ended
            setCompletedCycles((c) => c + 1);
            setPhase('inhale');
            return selectedPattern.inhaleSec;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, phase, selectedPattern]);

  // Phase Display Text & Color
  const phaseInfo = {
    inhale: { label: 'INSPIRA (Naso & Pancia)', color: 'from-cyan-500 to-blue-600', textCol: 'text-cyan-300', orbScale: 'scale-125' },
    hold: { label: 'TRATTIENI (Costole Aperte)', color: 'from-purple-500 to-indigo-600', textCol: 'text-purple-300', orbScale: 'scale-125 opacity-90' },
    exhale: { label: `ESPIRA (${selectedPattern.exhaleSound})`, color: 'from-amber-500 to-rose-600', textCol: 'text-amber-300', orbScale: 'scale-75' },
    rest: { label: 'RIPOSO (Rilassa la Gola)', color: 'from-slate-600 to-slate-800', textCol: 'text-slate-400', orbScale: 'scale-100' },
  }[phase];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Pattern Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PATTERNS.map((pattern) => {
          const isSelected = selectedPattern.id === pattern.id;
          return (
            <div
              key={pattern.id}
              onClick={() => setSelectedPattern(pattern)}
              className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                isSelected
                  ? 'bg-gradient-to-br from-indigo-950 to-slate-900 border-indigo-500 shadow-lg shadow-indigo-600/20'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <h4 className={`text-sm font-bold ${isSelected ? 'text-indigo-300' : 'text-white'}`}>
                {pattern.name}
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{pattern.description}</p>
              <div className="flex items-center space-x-2 text-[11px] font-semibold text-indigo-400 mt-3">
                <span>In: {pattern.inhaleSec}s</span>
                <span>•</span>
                <span>Hold: {pattern.holdSec}s</span>
                <span>•</span>
                <span>Ex: {pattern.exhaleSec}s</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Breathing Orb Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center justify-center text-center relative overflow-hidden">
        <div className="absolute top-4 left-4 flex items-center space-x-2 text-xs text-slate-400">
          <Wind className="w-4 h-4 text-indigo-400" />
          <span>Cicli completati: <strong className="text-white font-bold">{completedCycles}</strong></span>
        </div>

        {/* Animated Orb */}
        <div className="relative my-10 flex items-center justify-center">
          <div
            className={`w-48 sm:w-60 h-48 sm:h-60 rounded-full bg-gradient-to-br ${phaseInfo.color} flex flex-col items-center justify-center text-white shadow-2xl transition-all duration-1000 transform ${
              isActive ? phaseInfo.orbScale : 'scale-100'
            }`}
          >
            <span className="text-5xl sm:text-6xl font-black">{phaseSecondsLeft}s</span>
            <span className="text-xs font-bold uppercase tracking-wider mt-1 opacity-90 px-3 text-center">
              {phaseInfo.label.split(' ')[0]}
            </span>
          </div>
        </div>

        {/* Phase Action Instruction */}
        <div className="space-y-2 max-w-md">
          <h3 className={`text-xl font-black ${phaseInfo.textCol}`}>
            {phaseInfo.label}
          </h3>
          <p className="text-xs text-slate-400">
            {phase === 'inhale' && 'Gonfia la parte bassa della pancia e i fianchi, mantenendo le spalle ferme e rilassate.'}
            {phase === 'hold' && 'Mantieni l\'espansione toracica senza bloccare la gola o chiudere la glottide.'}
            {phase === 'exhale' && `Fai uscire un filo d'aria sottile e costante con il suono: ${selectedPattern.exhaleSound}.`}
            {phase === 'rest' && 'Rilascia ogni tensione nell\'addome e preparati al ciclo successivo.'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-4 mt-8">
          <button
            onClick={() => setIsActive(!isActive)}
            className={`flex items-center space-x-3 px-8 py-3.5 rounded-2xl font-black text-sm shadow-xl transition-all ${
              isActive
                ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/30'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
            }`}
          >
            {isActive ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            <span>{isActive ? 'Pausa' : 'Avvia Respirazione'}</span>
          </button>

          <button
            onClick={() => {
              setIsActive(false);
              setPhase('inhale');
              setPhaseSecondsLeft(selectedPattern.inhaleSec);
              setCompletedCycles(0);
            }}
            className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl transition-colors"
            title="Reset"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
