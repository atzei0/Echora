import React, { useState } from 'react';
import { NoteNotation, VocalRangeProfile } from '../types';
import { VocalExercisePlayer } from './VocalExercisePlayer';
import { Droplets, ShieldCheck } from 'lucide-react';

interface VocalCooldownViewProps {
  notation: NoteNotation;
  vocalProfile: VocalRangeProfile | null;
  onExerciseComplete: (title: string, durationSec: number) => void;
  onNavigate?: (tab: string, subTool?: string) => void;
  onGoBack?: () => void;
  canGoBack?: boolean;
  backButtonLabel?: string;
}

export const VocalCooldownView: React.FC<VocalCooldownViewProps> = ({
  notation,
  vocalProfile,
  onExerciseComplete,
  onNavigate,
  onGoBack,
  canGoBack,
  backButtonLabel,
}) => {
  // Vocal Hygiene Checklist state
  const [checklist, setChecklist] = useState({
    water: false,
    neckStretch: false,
    jawRelease: false,
    vocalRest: false,
  });

  return (
    <div className="bg-[#121826] min-h-screen text-slate-100 pb-16">
      {/* Main Interactive Exercise Player for Defaticamento */}
      <VocalExercisePlayer
        notation={notation}
        vocalProfile={vocalProfile}
        onExerciseComplete={onExerciseComplete}
        allowedCategories={['Defaticamento']}
        title="Defaticamento Vocale"
        sectionBadge="Defaticamento Vocale"
        onNavigate={onNavigate}
        onGoBack={onGoBack}
        canGoBack={canGoBack}
        backButtonLabel={backButtonLabel}
      />

      {/* Interactive Vocal Hygiene Checklist Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8">
        <div className="bg-slate-900 border border-[#34D399]/80 rounded-2xl p-6 space-y-4 shadow-xl">
          <h3 className="text-sm font-black uppercase tracking-wider text-[#34D399] flex items-center gap-2">
            <Droplets className="w-5 h-5 text-[#34D399]" /> Checklist Igiene Vocale Post-Canto
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <label className="flex items-center space-x-3 cursor-pointer text-slate-300 hover:text-white p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <input
                type="checkbox"
                checked={checklist.water}
                onChange={(e) => setChecklist((c) => ({ ...c, water: e.target.checked }))}
                className="rounded accent-[#34D399] w-4 h-4 cursor-pointer"
              />
              <span>💧 Bevi un bicchiere d'acqua a temperatura ambiente</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer text-slate-300 hover:text-white p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <input
                type="checkbox"
                checked={checklist.neckStretch}
                onChange={(e) => setChecklist((c) => ({ ...c, neckStretch: e.target.checked }))}
                className="rounded accent-[#34D399] w-4 h-4 cursor-pointer"
              />
              <span>🧘 Stretching leggero del collo e delle spalle (1 minuto)</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer text-slate-300 hover:text-white p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <input
                type="checkbox"
                checked={checklist.jawRelease}
                onChange={(e) => setChecklist((c) => ({ ...c, jawRelease: e.target.checked }))}
                className="rounded accent-[#34D399] w-4 h-4 cursor-pointer"
              />
              <span>💆 Massaggio delicato dei muscoli masseteri (mandibola)</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer text-slate-300 hover:text-white p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <input
                type="checkbox"
                checked={checklist.vocalRest}
                onChange={(e) => setChecklist((c) => ({ ...c, vocalRest: e.target.checked }))}
                className="rounded accent-[#34D399] w-4 h-4 cursor-pointer"
              />
              <span>🤫 15 minuti di riposo vocale senza sussurrare né gridare</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
