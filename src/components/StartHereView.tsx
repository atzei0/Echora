import React, { useState } from 'react';
import { NoteNotation, VocalRangeProfile } from '../types';
import { VocalRangeTester } from './VocalRangeTester';
import { PitchDetectorView } from './PitchDetectorView';
import { BreathingTrainer } from './BreathingTrainer';
import { RoutineGeneratorPanel } from './RoutineGeneratorPanel';
import { Play, Sparkles, Activity, ShieldCheck, ArrowRight, CheckCircle2, Mic, Wind, Brain, Flame, Target, Heart, Lightbulb, Zap, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface StartHereViewProps {
  notation: NoteNotation;
  vocalProfile: VocalRangeProfile | null;
  onSaveProfile: (profile: VocalRangeProfile) => void;
  onNavigate: (tab: string, subTool?: 'range' | 'tuner' | 'breathing' | 'routine', fromLabel?: string) => void;
  activeSubTool?: 'range' | 'tuner' | 'breathing' | 'routine';
  onSubToolChange?: (subTool: 'range' | 'tuner' | 'breathing' | 'routine') => void;
}

export const StartHereView: React.FC<StartHereViewProps> = ({
  notation,
  vocalProfile,
  onSaveProfile,
  onNavigate,
  activeSubTool: controlledSubTool = 'routine',
  onSubToolChange,
}) => {
  const { t, language } = useLanguage();
  const [internalSubTool, setInternalSubTool] = useState<'range' | 'tuner' | 'breathing' | 'routine'>(controlledSubTool);

  const activeSubTool = controlledSubTool || internalSubTool;

  const handleSubToolSelect = (tool: 'range' | 'tuner' | 'breathing' | 'routine') => {
    setInternalSubTool(tool);
    if (onSubToolChange) {
      onSubToolChange(tool);
    }
  };

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-cyan-950 border-b border-sky-400/80 py-6 sm:py-10 px-3 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-4">
          <h1 className="text-2xl sm:text-5xl font-black text-white tracking-tight" style={{ fontSize: '44px' }}>
            {language === 'en' ? 'Start Here!' : 'Inizia qui!'}
          </h1>

          {/* Welcome Text Block */}
          <div className="bg-slate-900/80 border border-sky-400/40 rounded-2xl sm:rounded-3xl p-4 sm:p-8 space-y-3.5 sm:space-y-4 shadow-xl backdrop-blur-sm">
            <h2 className="text-lg sm:text-2xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400" />
              <span>{t('welcomeHeadline')}</span>
            </h2>

            <p className="text-xs sm:text-base text-slate-200 font-medium leading-relaxed">
              {t('welcomeP1')}
            </p>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {t('welcomeP2')}
            </p>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {t('welcomeP3')}
            </p>

            <div className="pt-2 border-t border-slate-800/80 space-y-1">
              <p className="text-xs sm:text-base font-extrabold text-sky-300">
                {t('welcomeP4')}
              </p>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                {t('welcomeP5')}
              </p>
            </div>
          </div>

          {/* Workout Structure Guide Block */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-8 space-y-5 sm:space-y-6 shadow-2xl">
            <div className="border-b border-slate-800 pb-3 sm:pb-4 space-y-1">
              <h2 className="text-xl sm:text-3xl font-black text-white">
                {t('structureTitle')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 font-medium">
                {t('structureSubtitle')}
              </p>
            </div>

            {/* 3 Phases Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              
              {/* Phase 1: Riscaldamento */}
              <div className="bg-slate-950/80 border border-[#fa83b5]/40 rounded-2xl p-5 space-y-4 hover:border-[#fa83b5]/80 transition-all flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-[#fa83b5]">
                    <Flame className="w-5 h-5 text-[#fa83b5]" />
                    <h3 className="text-lg font-black text-white">{t('phase1Title')}</h3>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {t('phase1Desc1')}
                  </p>
                  <p className="text-xs font-bold text-pink-300 bg-pink-950/30 p-2.5 rounded-xl border border-pink-800/40">
                    {t('phase1Desc2')}
                  </p>
                </div>

                <button
                  onClick={() => onNavigate('exercises')}
                  className="w-full mt-4 py-2.5 rounded-xl bg-[#fa83b5]/30 hover:bg-[#fa83b5] text-pink-100 hover:text-white border border-[#fa83b5]/50 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <span>{t('step1Btn')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Phase 2: Allenamento */}
              <div className="bg-slate-950/80 border border-cyan-500/30 rounded-2xl p-5 space-y-4 hover:border-cyan-400/60 transition-all flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-cyan-400">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-lg font-black text-white">{t('phase2Title')}</h3>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                    {t('phase2Desc')}
                  </p>
                </div>

                <button
                  onClick={() => onNavigate('workout')}
                  className="w-full mt-4 py-2.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600 text-cyan-200 hover:text-white border border-cyan-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <span>{t('step2Btn')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Phase 3: Defaticamento */}
              <div className="bg-slate-950/80 border border-[#34D399]/40 rounded-2xl p-5 space-y-4 hover:border-[#34D399]/80 transition-all flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-[#34D399]">
                    <Heart className="w-5 h-5 text-[#34D399]" />
                    <h3 className="text-lg font-black text-white">{t('phase3Title')}</h3>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                    {t('phase3Desc1')}
                  </p>
                </div>

                <button
                  onClick={() => onNavigate('cooldown')}
                  className="w-full mt-4 py-2.5 rounded-xl bg-[#34D399]/30 hover:bg-[#34D399] text-emerald-100 hover:text-slate-950 border border-[#34D399]/50 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <span>{t('step3Btn')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

            {/* Golden Advice Box */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-950/50 via-slate-900 to-sky-950/50 border border-amber-500/40 space-y-3 shadow-lg">
              <div className="flex items-center space-x-2 text-amber-400 font-black text-base">
                <Lightbulb className="w-5 h-5 fill-amber-400 text-amber-400 animate-pulse" />
                <h3>{t('goldenAdviceTitle')}</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">
                {t('goldenAdviceP1')}
              </p>
              <p className="text-xs sm:text-sm text-sky-200 font-bold pt-1 border-t border-slate-800">
                {t('goldenAdviceP3')}
              </p>
              <div className="mt-3 pt-3 border-t border-amber-500/30 flex items-center justify-between flex-wrap gap-2 bg-amber-500/10 p-3 rounded-xl">
                <span className="text-xs sm:text-sm font-black text-amber-300">
                  {language === 'en' ? 'If you don\'t know where to start, use the routine generator!' : 'Se non sai da dove partire usa il generatore di routine!'}
                </span>
                <button
                  onClick={() => {
                    handleSubToolSelect('routine');
                    const element = document.getElementById('sub-tools-container');
                    if (element) element.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md transition-all transform hover:scale-[1.02]"
                >
                  <span>{language === 'en' ? 'Open Generator' : 'Generatore di Routine'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>


        </div>
      </div>

      {/* Sub Tools Tabs (Estensione, Tuner, Fiato, Coach) */}
      <div id="sub-tools-container" className="max-w-7xl mx-auto px-3 sm:px-6 mt-6 sm:mt-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">{t('toolsTitle')}</h2>
            <p className="text-xs text-slate-400">{t('toolsSubtitle')}</p>
          </div>

          <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-sky-900/50 overflow-x-auto scrollbar-none max-w-full">
            <button
              onClick={() => handleSubToolSelect('range')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                activeSubTool === 'range' ? 'bg-gradient-to-r from-sky-600 via-cyan-600 to-sky-700 text-white shadow-md border border-sky-400/50' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('subToolRange')}
            </button>
            <button
              onClick={() => handleSubToolSelect('tuner')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                activeSubTool === 'tuner' ? 'bg-gradient-to-r from-sky-600 via-cyan-600 to-sky-700 text-white shadow-md border border-sky-400/50' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('subToolTuner')}
            </button>
            <button
              onClick={() => handleSubToolSelect('routine')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                activeSubTool === 'routine' ? 'bg-gradient-to-r from-sky-600 via-cyan-600 to-sky-700 text-white shadow-md border border-sky-400/50' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('subToolRoutine')}
            </button>
          </div>
        </div>

        {/* Selected Sub Tool Component */}
        <div className="bg-slate-900/60 rounded-3xl border border-sky-400/80 p-2 sm:p-4 shadow-2xl">
          {activeSubTool === 'range' && (
            <VocalRangeTester
              notation={notation}
              vocalProfile={vocalProfile}
              onSaveProfile={onSaveProfile}
            />
          )}

          {activeSubTool === 'tuner' && <PitchDetectorView notation={notation} />}

          {activeSubTool === 'routine' && <RoutineGeneratorPanel onNavigate={onNavigate} />}
        </div>
      </div>
    </div>
  );
};

