import React, { useState, useRef } from 'react';
import { NoteNotation, VocalRangeProfile, VoiceCategory } from '../types';
import { getNoteInfo, classifyVoice, playPianoNote, VOICE_REGISTER_DEFINITIONS } from '../utils/audioSynth';
import { PitchDetector } from '../utils/pitchDetector';
import { InteractivePiano } from './InteractivePiano';
import { Award, Mic, CheckCircle, ArrowRight, RotateCcw, Volume2, Sparkles, Info, Music } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface VocalRangeTesterProps {
  notation: NoteNotation;
  vocalProfile: VocalRangeProfile | null;
  onSaveProfile: (profile: VocalRangeProfile) => void;
}

export const VocalRangeTester: React.FC<VocalRangeTesterProps> = ({
  notation,
  vocalProfile,
  onSaveProfile,
}) => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [step, setStep] = useState<'intro' | 'lowest' | 'highest' | 'result'>('intro');
  const [lowestMidi, setLowestMidi] = useState<number>(55); // G3
  const [highestMidi, setHighestMidi] = useState<number>(72); // C5

  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [detectedNoteName, setDetectedNoteName] = useState<string | null>(null);
  const pitchDetectorRef = useRef<PitchDetector | null>(null);

  const startMic = async () => {
    setIsMicActive(true);
    if (!pitchDetectorRef.current) {
      pitchDetectorRef.current = new PitchDetector();
    }
    await pitchDetectorRef.current.start(
      (pitch) => {
        if (pitch.detectedFreq > 0 && pitch.clarity > 0.4) {
          const noteInfo = pitch.closestNote;
          setDetectedNoteName(notation === 'latin' ? noteInfo.nameLatin : noteInfo.nameScientific);
          if (step === 'lowest') {
            setLowestMidi(noteInfo.midi);
          } else if (step === 'highest') {
            setHighestMidi(noteInfo.midi);
          }
        }
      },
      (err) => {
        console.error(err);
        setIsMicActive(false);
      }
    );
  };

  const stopMic = () => {
    setIsMicActive(false);
    if (pitchDetectorRef.current) {
      pitchDetectorRef.current.stop();
    }
  };

  const handleFinish = () => {
    stopMic();
    const low = Math.min(lowestMidi, highestMidi);
    const high = Math.max(lowestMidi, highestMidi);
    const lowInfo = getNoteInfo(low);
    const highInfo = getNoteInfo(high);
    const semitones = high - low;
    const cat = classifyVoice(low, high);

    const profile: VocalRangeProfile = {
      lowestMidi: low,
      highestMidi: high,
      lowestNote: notation === 'latin' ? lowInfo.nameLatin : lowInfo.nameScientific,
      highestNote: notation === 'latin' ? highInfo.nameLatin : highInfo.nameScientific,
      totalSemitones: semitones,
      voiceCategory: cat as VoiceCategory,
      testedAt: new Date().toLocaleDateString(isEn ? 'en-US' : 'it-IT'),
    };

    onSaveProfile(profile);
    setStep('result');
  };

  const lowestInfo = getNoteInfo(lowestMidi);
  const highestInfo = getNoteInfo(highestMidi);

  const femaleRegisters = VOICE_REGISTER_DEFINITIONS.filter((r) => r.gender === 'female');
  const maleRegisters = VOICE_REGISTER_DEFINITIONS.filter((r) => r.gender === 'male');

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4 py-6 sm:py-8 space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 mx-auto flex items-center justify-center shadow-lg shadow-purple-600/30 mb-2">
            <Award className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            {isEn ? 'Vocal Range Test' : 'Test dell\'Estensione Vocale'}
          </h2>
          <p className="text-slate-400 text-[13px] leading-relaxed">
            {isEn
              ? 'Discover your vocal classification (Soprano, Tenor, Baritone, etc.) and auto-adapt all exercises!'
              : 'Scopri la tua tessitura (Soprano, Tenore, Baritono, ecc.) e imposta l\'estensione ideale per tutti gli esercizi!'}
          </p>
        </div>

        {/* STEP 0: INTRO */}
        {step === 'intro' && (
          <div className="space-y-6">
            {/* Standard Registers Table */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center space-x-2 text-indigo-400 font-bold text-sm">
                <Music className="w-4 h-4 text-indigo-400" />
                <h3>{isEn ? 'Standard Vocal Registers Reference:' : 'Registri Vocali di Riferimento:'}</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Femminili */}
                <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-2">
                  <span className="font-extrabold text-purple-300 uppercase tracking-wider text-[11px] block border-b border-purple-500/20 pb-1">
                    {isEn ? 'Female Voices (Femminili)' : 'Voci Femminili'}
                  </span>
                  <ul className="space-y-1.5 text-slate-200">
                    {femaleRegisters.map((reg) => (
                      <li key={reg.category} className="flex justify-between items-center py-0.5">
                        <span className="font-bold text-white">{reg.category}:</span>
                        <span className="font-mono text-purple-200 bg-purple-900/40 px-2 py-0.5 rounded text-[11px]">
                          {notation === 'latin' ? reg.lowNameLatin : reg.lowNameScientific} - {notation === 'latin' ? reg.highNameLatin : reg.highNameScientific}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Maschili */}
                <div className="p-3.5 rounded-xl bg-sky-950/30 border border-sky-500/30 space-y-2">
                  <span className="font-extrabold text-sky-300 uppercase tracking-wider text-[11px] block border-b border-sky-500/20 pb-1">
                    {isEn ? 'Male Voices (Maschili)' : 'Voci Maschili'}
                  </span>
                  <ul className="space-y-1.5 text-slate-200">
                    {maleRegisters.map((reg) => (
                      <li key={reg.category} className="flex justify-between items-center py-0.5">
                        <span className="font-bold text-white">{reg.category}:</span>
                        <span className="font-mono text-sky-200 bg-sky-900/40 px-2 py-0.5 rounded text-[11px]">
                          {notation === 'latin' ? reg.lowNameLatin : reg.lowNameScientific} - {notation === 'latin' ? reg.highNameLatin : reg.highNameScientific}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <span className="text-purple-400 font-bold text-xs uppercase tracking-wider">Passo 1</span>
                <h4 className="text-base font-bold text-white mt-1">Nota Più Bassa (Grave)</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Canta scendendo gradualmente fino alla nota più grave che riesci ad emettere in modo confortevole.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <span className="text-indigo-400 font-bold text-xs uppercase tracking-wider">Passo 2</span>
                <h4 className="text-base font-bold text-white mt-1">Nota Più Alta (Acuta)</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Canta salendo la scala verso l'alto fino al limite superiore del tuo registro di petto/testa.
                </p>
              </div>
            </div>

            {vocalProfile && (
              <div className="bg-purple-950/50 p-4 rounded-2xl border border-purple-500/30 text-left flex justify-between items-center">
                <div>
                  <span className="text-xs text-purple-300 font-semibold">Ultimo test registrato:</span>
                  <p className="text-lg font-black text-white">
                    {vocalProfile.voiceCategory} ({vocalProfile.lowestNote} - {vocalProfile.highestNote})
                  </p>
                </div>
                <span className="text-xs text-purple-400 font-bold">{vocalProfile.totalSemitones} Semitoni</span>
              </div>
            )}

            <div className="text-center pt-2">
              <button
                onClick={() => {
                  setStep('lowest');
                  startMic();
                }}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 text-white font-black text-base rounded-2xl shadow-xl hover:brightness-110 transition-all transform hover:scale-[1.02]"
              >
                Inizia il Test Guidato
              </button>
            </div>

            {/* Clarification Note */}
            <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs leading-relaxed flex items-start gap-2 text-left">
              <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Nota bene:</strong> questo è un test approssimativo, la voce può variare giornalmente di qualche semitono, e l'estensione può aumentare man mano che si ottimizza l'utilizzo della voce.
              </span>
            </div>
          </div>
        )}

        {/* STEP 1: LOWEST NOTE */}
        {step === 'lowest' && (
          <div className="space-y-6 text-center">
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Fase 1 di 2</span>
              <h3 className="text-xl font-black text-white">Trova la tua Nota Più Bassa (Grave)</h3>
              <p className="text-xs text-slate-400 max-w-lg mx-auto">
                Canta una nota grave e confortevole nel microfono, oppure usa i pulsanti per regolare la nota più bassa.
              </p>

              {/* Note Display & Adjuster */}
              <div className="flex items-center justify-center space-x-4 my-4">
                <button
                  onClick={() => {
                    const next = Math.max(36, lowestMidi - 1);
                    setLowestMidi(next);
                    playPianoNote(next);
                  }}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-xl transition-all"
                >
                  -1 Semitono
                </button>

                <div className="p-4 bg-slate-900 rounded-2xl border border-purple-500/40 min-w-[140px] shadow-lg">
                  <span className="text-3xl font-black text-purple-300">
                    {notation === 'latin' ? lowestInfo.nameLatin : lowestInfo.nameScientific}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1">{lowestInfo.frequency} Hz</p>
                </div>

                <button
                  onClick={() => {
                    const next = Math.min(72, lowestMidi + 1);
                    setLowestMidi(next);
                    playPianoNote(next);
                  }}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-xl transition-all"
                >
                  +1 Semitono
                </button>
              </div>

              {detectedNoteName && (
                <div className="text-xs text-emerald-400 font-semibold animate-pulse">
                  Rilevato dal microfono: <strong>{detectedNoteName}</strong>
                </div>
              )}

              {/* Piano Keyboard Indication */}
              <div className="pt-2">
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                  🎹 Posizione sulla Tastiera del Pianoforte:
                </p>
                <InteractivePiano
                  startOctave={2}
                  numOctaves={3}
                  highlightMidi={lowestMidi}
                  notation={notation}
                  onNotePlay={(m) => setLowestMidi(m)}
                />
              </div>
            </div>

            <button
              onClick={() => {
                setStep('highest');
              }}
              className="flex items-center justify-center space-x-2 w-full sm:w-auto mx-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm rounded-2xl shadow-lg transition-all"
            >
              <span>Conferma Nota Bassa e Vai Avanti</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: HIGHEST NOTE */}
        {step === 'highest' && (
          <div className="space-y-6 text-center">
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Fase 2 di 2</span>
              <h3 className="text-xl font-black text-white">Trova la tua Nota Più Alta (Acuta)</h3>
              <p className="text-xs text-slate-400 max-w-lg mx-auto">
                Ora canta la nota più acuta che riesci ad emettere senza sforzare la gola.
              </p>

              {/* Note Display & Adjuster */}
              <div className="flex items-center justify-center space-x-4 my-4">
                <button
                  onClick={() => {
                    const next = Math.max(48, highestMidi - 1);
                    setHighestMidi(next);
                    playPianoNote(next);
                  }}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-xl transition-all"
                >
                  -1 Semitono
                </button>

                <div className="p-4 bg-slate-900 rounded-2xl border border-indigo-500/40 min-w-[140px] shadow-lg">
                  <span className="text-3xl font-black text-indigo-300">
                    {notation === 'latin' ? highestInfo.nameLatin : highestInfo.nameScientific}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1">{highestInfo.frequency} Hz</p>
                </div>

                <button
                  onClick={() => {
                    const next = Math.min(96, highestMidi + 1);
                    setHighestMidi(next);
                    playPianoNote(next);
                  }}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-xl transition-all"
                >
                  +1 Semitono
                </button>
              </div>

              {detectedNoteName && (
                <div className="text-xs text-emerald-400 font-semibold animate-pulse">
                  Rilevato dal microfono: <strong>{detectedNoteName}</strong>
                </div>
              )}

              {/* Piano Keyboard Indication */}
              <div className="pt-2">
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                  🎹 Posizione sulla Tastiera del Pianoforte:
                </p>
                <InteractivePiano
                  startOctave={3}
                  numOctaves={3}
                  highlightMidi={highestMidi}
                  notation={notation}
                  onNotePlay={(m) => setHighestMidi(m)}
                />
              </div>
            </div>

            <button
              onClick={handleFinish}
              className="flex items-center justify-center space-x-2 w-full sm:w-auto mx-auto px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:brightness-110 text-white font-black text-sm rounded-2xl shadow-lg transition-all"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Calcola il Mio Profilo Vocale</span>
            </button>
          </div>
        )}

        {/* STEP 3: RESULT */}
        {step === 'result' && vocalProfile && (
          <div className="space-y-6 text-center">
            <div className="bg-gradient-to-br from-purple-950 via-slate-950 to-indigo-950 p-6 sm:p-8 rounded-3xl border border-purple-500/40 shadow-2xl space-y-6">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-950/80 px-3 py-1 rounded-full border border-amber-600/40">
                Risultato Test Vocale
              </span>

              <h3 className="text-4xl sm:text-5xl font-black text-white mt-2">
                {vocalProfile.voiceCategory}
              </h3>

              <div className="flex justify-center items-center space-x-6 text-sm sm:text-base font-bold text-slate-300 flex-wrap gap-y-3">
                <div>
                  <span className="text-xs text-slate-400 block font-normal">Estensione Misurata:</span>
                  <span className="text-indigo-300 text-xl sm:text-2xl font-extrabold">{vocalProfile.lowestNote}</span> a <span className="text-purple-300 text-xl sm:text-2xl font-extrabold">{vocalProfile.highestNote}</span>
                </div>
                <div className="w-px h-10 bg-slate-800 hidden sm:block"></div>
                <div>
                  <span className="text-xs text-slate-400 block font-normal">Ampiezza Totale:</span>
                  <span className="text-emerald-400 text-xl sm:text-2xl font-extrabold">{vocalProfile.totalSemitones} Semitoni</span> (~{(vocalProfile.totalSemitones / 12).toFixed(1)} Ottave)
                </div>
              </div>

              {/* PIANO KEYBOARD HIGHLIGHTED RESULT */}
              <div className="pt-2 text-left bg-slate-950/80 p-4 rounded-2xl border border-purple-500/30">
                <InteractivePiano
                  startOctave={2}
                  numOctaves={4}
                  rangeStartMidi={vocalProfile.lowestMidi}
                  rangeEndMidi={vocalProfile.highestMidi}
                  notation={notation}
                />
              </div>

              <p className="text-xs text-slate-300 max-w-md mx-auto pt-1 leading-relaxed">
                🎉 Profilo salvato con successo! Tutti gli esercizi vocali dell'app sono stati automaticamente sincronizzati alla tua estensione.
              </p>
            </div>

            {/* MANDATORY CLARIFICATION NOTE */}
            <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs leading-relaxed flex items-start gap-2 text-left">
              <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Nota bene:</strong> questo è un test approssimativo, la voce può variare giornalmente di qualche semitono, e l'estensione può aumentare man mano che si ottimizza l'utilizzo della voce.
              </span>
            </div>

            <button
              onClick={() => setStep('intro')}
              className="flex items-center justify-center space-x-2 mx-auto px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Ripeti il Test</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
