import React, { useState, useEffect } from 'react';
import { NoteNotation, VocalRangeProfile } from '../types';
import { VocalRangeTester } from './VocalRangeTester';
import { PitchDetectorView } from './PitchDetectorView';
import { BreathingTrainer } from './BreathingTrainer';
import { RoutineGeneratorPanel } from './RoutineGeneratorPanel';
import { TempoTrainer } from './TempoTrainer';
import { Mic, Activity, Wind, Sliders, Clock, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface ToolsViewProps {
  notation: NoteNotation;
  vocalProfile: VocalRangeProfile | null;
  onSaveProfile: (profile: VocalRangeProfile) => void;
  onNavigate: (tab: string, subTool?: 'range' | 'tuner' | 'breathing' | 'routine' | 'tempo', fromLabel?: string) => void;
  initialSubTool?: 'range' | 'tuner' | 'breathing' | 'routine' | 'tempo';
}

export const ToolsView: React.FC<ToolsViewProps> = ({
  notation,
  vocalProfile,
  onSaveProfile,
  onNavigate,
  initialSubTool = 'range',
}) => {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const [activeTool, setActiveTool] = useState<'range' | 'tuner' | 'breathing' | 'routine' | 'tempo'>(initialSubTool || 'range');

  useEffect(() => {
    if (initialSubTool) {
      setActiveTool(initialSubTool);
    } else {
      setActiveTool('range');
    }
  }, [initialSubTool]);

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 pb-20">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 border-b border-sky-400/60 py-8 sm:py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-4 text-center sm:text-left">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-400/30 text-sky-300 text-xs font-extrabold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>{isEn ? 'Other Tools' : 'Altri Strumenti'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            {isEn ? 'Other Tools' : 'Altri Strumenti'}
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
            {isEn
              ? 'Measure your vocal range, check your pitch, train your breath support, generate tailored routines, or master tempo and groove.'
              : 'Mappa la tua estensione, controlla l\'intonazione, allena la respirazione diaframmatica, genera routine su misura o padroneggia tempo e groove.'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 mt-6 sm:mt-8 space-y-6">
        {/* Navigation Selector Tabs */}
        <div className="flex items-center space-x-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto scrollbar-none shadow-xl">
          {/* 1. Estensione Vocale */}
          <button
            type="button"
            onClick={() => setActiveTool('range')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
              activeTool === 'range'
                ? 'bg-gradient-to-r from-sky-600 via-cyan-600 to-sky-700 text-white shadow-md border border-sky-400/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>{isEn ? 'Vocal Range' : 'Estensione Vocale'}</span>
          </button>

          {/* 2. Intonazione */}
          <button
            type="button"
            onClick={() => setActiveTool('tuner')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
              activeTool === 'tuner'
                ? 'bg-gradient-to-r from-sky-600 via-cyan-600 to-sky-700 text-white shadow-md border border-sky-400/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>{isEn ? 'Pitch & Tuner' : 'Intonazione'}</span>
          </button>

          {/* 3. Respirazione (Affianco ad Intonazione) */}
          <button
            type="button"
            onClick={() => setActiveTool('breathing')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
              activeTool === 'breathing'
                ? 'bg-gradient-to-r from-sky-600 via-cyan-600 to-sky-700 text-white shadow-md border border-sky-400/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Wind className="w-4 h-4" />
            <span>{isEn ? 'Breathing' : 'Respirazione'}</span>
          </button>

          {/* 4. Generatore di Routine */}
          <button
            type="button"
            onClick={() => setActiveTool('routine')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
              activeTool === 'routine'
                ? 'bg-gradient-to-r from-sky-600 via-cyan-600 to-sky-700 text-white shadow-md border border-sky-400/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>{isEn ? 'Routine Generator' : 'Generatore di Routine'}</span>
          </button>

          {/* 5. Allenamento sul Tempo */}
          <button
            type="button"
            onClick={() => setActiveTool('tempo')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
              activeTool === 'tempo'
                ? 'bg-gradient-to-r from-sky-600 via-cyan-600 to-sky-700 text-white shadow-md border border-sky-400/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{isEn ? 'Tempo Training' : 'Allenamento sul Tempo'}</span>
          </button>
        </div>

        {/* Tool Content Container */}
        <div className="bg-slate-900/60 rounded-3xl border border-sky-400/60 p-3 sm:p-6 shadow-2xl">
          {activeTool === 'range' && (
            <VocalRangeTester
              notation={notation}
              vocalProfile={vocalProfile}
              onSaveProfile={onSaveProfile}
            />
          )}

          {activeTool === 'tuner' && <PitchDetectorView notation={notation} />}

          {activeTool === 'breathing' && <BreathingTrainer />}

          {activeTool === 'routine' && <RoutineGeneratorPanel onNavigate={onNavigate} />}

          {activeTool === 'tempo' && <TempoTrainer />}
        </div>
      </div>
    </div>
  );
};
