import React, { useState, useEffect } from 'react';
import { NoteNotation, VocalRangeProfile } from '../types';
import { VocalRangeTester } from './VocalRangeTester';
import { PitchDetectorView } from './PitchDetectorView';
import { RoutineGeneratorPanel } from './RoutineGeneratorPanel';
import { Mic, Activity, Sliders, Clock, Sparkles, Play, Volume2, Timer } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface ToolsViewProps {
  notation: NoteNotation;
  vocalProfile: VocalRangeProfile | null;
  onSaveProfile: (profile: VocalRangeProfile) => void;
  onNavigate: (tab: string, subTool?: 'range' | 'tuner' | 'breathing' | 'routine' | 'tempo', fromLabel?: string) => void;
  initialSubTool?: 'range' | 'tuner' | 'routine' | 'tempo';
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
  const [activeTool, setActiveTool] = useState<'range' | 'tuner' | 'routine' | 'tempo'>(initialSubTool);

  useEffect(() => {
    if (initialSubTool) {
      setActiveTool(initialSubTool);
    }
  }, [initialSubTool]);

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 pb-20">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 border-b border-sky-400/60 py-8 sm:py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-4 text-center sm:text-left">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-400/30 text-sky-300 text-xs font-extrabold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>{isEn ? 'Vocal Toolkit' : 'Strumenti di Supporto'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            {isEn ? 'Tools' : 'Strumenti'}
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
            {isEn
              ? 'Measure your vocal range, check your pitch in real time, generate tailored routines, or train your internal tempo.'
              : 'Mappa la tua estensione, controlla l\'intonazione in tempo reale, genera routine su misura o allenati sul tempo.'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 mt-6 sm:mt-8 space-y-6">
        {/* Navigation Selector Tabs */}
        <div className="flex items-center space-x-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto scrollbar-none shadow-xl">
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

          {activeTool === 'routine' && <RoutineGeneratorPanel onNavigate={onNavigate} />}

          {activeTool === 'tempo' && (
            <div className="py-12 px-6 sm:px-12 text-center space-y-6 max-w-2xl mx-auto">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-sky-500/20 via-cyan-500/20 to-indigo-500/20 border border-sky-400/40 flex items-center justify-center mx-auto shadow-xl">
                <Timer className="w-10 h-10 text-sky-400 animate-pulse" />
              </div>

              <div className="space-y-2">
                <div className="inline-block px-3 py-1 rounded-full bg-sky-950/80 border border-sky-500/30 text-sky-300 text-xs font-bold uppercase tracking-wider">
                  {isEn ? 'New Section' : 'Nuova Sezione'}
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  {isEn ? 'Tempo & Rhythm Training' : 'Allenamento sul Tempo'}
                </h3>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  {isEn
                    ? 'A dedicated module to train timing, rhythmic precision, internal pulse, and phrasing with custom tempo clicks and exercises.'
                    : 'Spazio dedicato all\'allenamento del tempo, della precisione ritmica, della pulsazione interna e del fraseggio vocale.'}
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs sm:text-sm text-slate-400 space-y-3">
                <p className="font-semibold text-sky-300">
                  {isEn
                    ? 'Features and exercises for this section will be defined soon.'
                    : 'I dettagli e il funzionamento di questa sezione verranno definiti e attivati più avanti.'}
                </p>
                <p className="text-slate-400">
                  {isEn
                    ? 'You will find metronomes, subdivision guides, and rhythm exercises tailored for contemporary singing.'
                    : 'Troverai metronomi visivi, guide di suddivisione e pattern ritmici specifici per cantanti.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
