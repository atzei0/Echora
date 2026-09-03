import React, { useState, useEffect, useRef } from 'react';
import { NoteNotation, PitchDetectionResult } from '../types';
import { PitchDetector } from '../utils/pitchDetector';
import { getNoteInfo, playPianoNote } from '../utils/audioSynth';
import { Mic, MicOff, Volume2, Activity, Play, Square, BookOpen, ChevronDown, ChevronUp, Radio } from 'lucide-react';

interface PitchDetectorViewProps {
  notation: NoteNotation;
}

export const PitchDetectorView: React.FC<PitchDetectorViewProps> = ({ notation }) => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [livePitch, setLivePitch] = useState<PitchDetectionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Istruzioni chiuse per default
  const [showGuide, setShowGuide] = useState<boolean>(false);

  // Pitch History for Canvas Chart
  const pitchHistoryRef = useRef<number[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Drone Reference Tone
  const [targetMidi, setTargetMidi] = useState<number>(60); // C4
  const [isPlayingDrone, setIsPlayingDrone] = useState<boolean>(false);
  const droneIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const pitchDetectorRef = useRef<PitchDetector | null>(null);

  const toggleListening = async () => {
    if (isListening) {
      if (pitchDetectorRef.current) {
        pitchDetectorRef.current.stop();
      }
      setIsListening(false);
      setLivePitch(null);
    } else {
      setErrorMsg(null);
      if (!pitchDetectorRef.current) {
        pitchDetectorRef.current = new PitchDetector();
      }
      const success = await pitchDetectorRef.current.start(
        (pitch) => {
          setLivePitch(pitch);
          if (pitch.detectedFreq > 0) {
            pitchHistoryRef.current.push(pitch.detectedFreq);
            if (pitchHistoryRef.current.length > 100) {
              pitchHistoryRef.current.shift();
            }
          }
        },
        (err) => {
          setErrorMsg(err);
          setIsListening(false);
        }
      );
      if (success) {
        setIsListening(true);
      }
    }
  };

  // Continuous Drone Loop
  useEffect(() => {
    if (isPlayingDrone) {
      playPianoNote(targetMidi, 1.2, 0.85);
      droneIntervalRef.current = setInterval(() => {
        playPianoNote(targetMidi, 1.2, 0.85);
      }, 1000);
    } else {
      if (droneIntervalRef.current) {
        clearInterval(droneIntervalRef.current);
        droneIntervalRef.current = null;
      }
    }

    return () => {
      if (droneIntervalRef.current) {
        clearInterval(droneIntervalRef.current);
        droneIntervalRef.current = null;
      }
    };
  }, [isPlayingDrone, targetMidi]);

  // Clean up pitch detector on unmount
  useEffect(() => {
    return () => {
      if (pitchDetectorRef.current) {
        pitchDetectorRef.current.stop();
      }
      if (droneIntervalRef.current) {
        clearInterval(droneIntervalRef.current);
      }
    };
  }, []);

  // Render Pitch Waveform Canvas
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderGraph = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let y = 15; y < canvas.height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      const history = pitchHistoryRef.current;
      if (history.length > 1) {
        ctx.strokeStyle = '#818cf8';
        ctx.lineWidth = 2.5;
        ctx.lineJoin = 'round';
        ctx.beginPath();

        const minF = 80;
        const maxF = 900;
        const stepX = canvas.width / 100;

        for (let i = 0; i < history.length; i++) {
          const freq = history[i];
          const x = i * stepX;
          const normalized = Math.max(0, Math.min(1, (freq - minF) / (maxF - minF)));
          const y = canvas.height - normalized * (canvas.height - 16) - 8;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();

        // Glowing dot on current point
        if (history.length > 0) {
          const lastFreq = history[history.length - 1];
          const x = (history.length - 1) * stepX;
          const normalized = Math.max(0, Math.min(1, (lastFreq - minF) / (maxF - minF)));
          const y = canvas.height - normalized * (canvas.height - 16) - 8;

          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      animId = requestAnimationFrame(renderGraph);
    };

    renderGraph();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  const targetNoteInfo = getNoteInfo(targetMidi);
  const cents = livePitch ? livePitch.centsDiff : 0;
  // Needle rotation calculation (-50 to +50 cents mapped to -75deg to +75deg)
  const needleDeg = Math.max(-85, Math.min(85, (cents / 50) * 75));

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4 py-6 sm:py-8 space-y-6">
      
      {/* BLOCCO UNICO DI FONDO (COME TEST DELL'ESTENSIONE VOCALE) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* HEADER UNIFICATO */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 mx-auto flex items-center justify-center shadow-lg shadow-indigo-600/30 mb-2">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Test dell'Intonazione
          </h2>
          <p className="text-slate-400 text-[13px] leading-relaxed">
            Verifica la precisione della tua intonazione e migliorala.
          </p>
        </div>

        {/* 1. SEZIONE ISTRUZIONI PER L'USO (CHIUSE DI DEFAULT) */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 shadow-md">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="w-full flex items-center justify-between text-left group"
          >
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                  Istruzioni per l'uso
                </h3>
                <p className="text-[11px] text-slate-400">
                  Istruzioni passo passo per verificare il tuo livello di intonazione e migliorare la precisione
                </p>
              </div>
            </div>
            <div className="p-1 rounded-lg bg-slate-800 text-slate-400 group-hover:text-white transition-colors">
              {showGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {showGuide && (
            <div className="mt-3.5 pt-3.5 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* Passo 1 */}
              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800/80 space-y-1">
                <div className="flex items-center space-x-1.5 text-indigo-400 font-bold text-[10px] uppercase tracking-wider">
                  <span className="w-4 h-4 rounded-full bg-indigo-900/60 flex items-center justify-center text-indigo-300 text-[9px]">1</span>
                  <span>Passo 1</span>
                </div>
                <h4 className="font-bold text-white text-xs">Ascolta nota guida</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Scegli una nota dalla sezione nota guida. Premi play e canta la nota insieme al player.
                </p>
              </div>

              {/* Passo 2 */}
              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800/80 space-y-1">
                <div className="flex items-center space-x-1.5 text-indigo-400 font-bold text-[10px] uppercase tracking-wider">
                  <span className="w-4 h-4 rounded-full bg-indigo-900/60 flex items-center justify-center text-indigo-300 text-[9px]">2</span>
                  <span>Passo 2</span>
                </div>
                <h4 className="font-bold text-white text-xs">Avvia il microfono</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Premi <strong>"Avvia Microfono"</strong> e canta una vocale aperta e costante (es. <em>"A"</em> o <em>"O"</em>) a volume moderato, cercando di fonderti con la nota.
                </p>
              </div>

              {/* Passo 3 */}
              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800/80 space-y-1">
                <div className="flex items-center space-x-1.5 text-indigo-400 font-bold text-[10px] uppercase tracking-wider">
                  <span className="w-4 h-4 rounded-full bg-indigo-900/60 flex items-center justify-center text-indigo-300 text-[9px]">3</span>
                  <span>Passo 3</span>
                </div>
                <h4 className="font-bold text-white text-xs">Leggi il quadrante</h4>
                <div className="text-[11px] text-slate-400 space-y-0.5">
                  <p><span className="text-emerald-400 font-semibold">0 Cents:</span> Intonazione perfetta al centro.</p>
                  <p><span className="text-amber-400 font-semibold">Negativo (Calante ♭):</span> Stai cantando una nota più bassa, sali leggermente finché non vedi 0 cents.</p>
                  <p><span className="text-purple-400 font-semibold">Positivo (Crescente ♯):</span> Stai cantando una nota più alta, scendi leggermente finché non vedi 0 cents.</p>
                </div>
              </div>

              {/* Passo 4 */}
              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800/80 space-y-1">
                <div className="flex items-center space-x-1.5 text-indigo-400 font-bold text-[10px] uppercase tracking-wider">
                  <span className="w-4 h-4 rounded-full bg-indigo-900/60 flex items-center justify-center text-indigo-300 text-[9px]">4</span>
                  <span>Passo 4</span>
                </div>
                <h4 className="font-bold text-white text-xs">Verifica stabilità</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Osserva il grafico d'onda: una linea continua orizzontale indica che hai un'emissione ferma e stabile con poche oscillazioni di nota.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 2. SEZIONE NOTA GUIDA (TRA ISTRUZIONI E TEST DELL'INTONAZIONE) */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-md">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-center sm:text-left">
              <h3 className="text-base font-black text-white flex items-center justify-center sm:justify-start gap-1.5">
                <Volume2 className="w-4 h-4 text-indigo-400" />
                <span>Nota guida</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Imposta una nota da cantare per il test
              </p>
            </div>

            {/* Controlli Nota Compatti */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
                <button
                  onClick={() => setTargetMidi((prev) => Math.max(36, prev - 12))}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold text-[11px] transition-colors"
                  title="Un'ottava sotto (-12 semitoni)"
                >
                  -8va
                </button>
                <button
                  onClick={() => setTargetMidi((prev) => Math.max(36, prev - 1))}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-[11px] transition-colors"
                  title="Un semitono sotto"
                >
                  -1
                </button>

                <div className="text-center px-2.5 py-1 bg-slate-950 rounded-lg min-w-[70px] border border-slate-800/80">
                  <span className="text-lg font-black text-indigo-300 tracking-tight block leading-tight">
                    {notation === 'latin' ? targetNoteInfo.nameLatin : targetNoteInfo.nameScientific}
                  </span>
                </div>

                <button
                  onClick={() => setTargetMidi((prev) => Math.min(84, prev + 1))}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-[11px] transition-colors"
                  title="Un semitono sopra"
                >
                  +1
                </button>
                <button
                  onClick={() => setTargetMidi((prev) => Math.min(84, prev + 12))}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold text-[11px] transition-colors"
                  title="Un'ottava sopra (+12 semitoni)"
                >
                  +8va
                </button>
              </div>

              {/* Tasto Play con solo simbolo */}
              <button
                onClick={() => setIsPlayingDrone(!isPlayingDrone)}
                className={`p-2.5 rounded-xl transition-all shadow-md flex items-center justify-center ${
                  isPlayingDrone
                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30 animate-pulse'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                }`}
                title={isPlayingDrone ? 'Stop nota' : 'Play nota'}
              >
                {isPlayingDrone ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* 3. SEZIONE MISURAZIONE TEST DELL'INTONAZIONE */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="text-center sm:text-left">
              <h2 className="text-lg font-black text-white flex items-center justify-center sm:justify-start gap-1.5">
                <Radio className="w-4 h-4 text-indigo-400" />
                <span>Rilevamento in tempo reale</span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Misurazione in centesimi di semitono, frequenza (Hz) e visualizzazione d'onda.
              </p>
            </div>

            <button
              onClick={toggleListening}
              className={`flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-md ${
                isListening
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
              }`}
            >
              {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              <span>{isListening ? 'Disattiva Microfono' : 'Avvia Microfono'}</span>
            </button>
          </div>

          {errorMsg && (
            <div className="mt-3 p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Live Pitch Gauge Area */}
          <div className="mt-4 flex flex-col items-center justify-center space-y-2">
            {/* Circular / Semi-circular Cents Needle Gauge */}
            <div className="relative w-44 h-22 sm:w-52 sm:h-26 overflow-hidden flex items-end justify-center">
              {/* Dial Background Arc */}
              <div className="absolute inset-0 rounded-t-full border-[10px] sm:border-[12px] border-slate-800 border-b-0"></div>

              {/* Target Perfect Green Center Zone */}
              <div className="absolute top-0 w-6 sm:w-7 h-full border-t-[10px] sm:border-t-[12px] border-emerald-500"></div>

              {/* Needle */}
              <div
                className="absolute bottom-0 w-1 bg-white origin-bottom rounded-full shadow-lg transition-transform duration-100 ease-out"
                style={{
                  height: '80%',
                  transform: `rotate(${needleDeg}deg)`,
                  backgroundColor: livePitch?.inTune ? '#34d399' : '#f43f5e'
                }}
              >
                <div className="w-2.5 h-2.5 -ml-0.5 -mt-0.5 rounded-full bg-white shadow-md"></div>
              </div>

              {/* Pivot */}
              <div className="w-4 h-4 rounded-full bg-slate-700 border-2 border-white z-10 -mb-2 shadow-md"></div>
            </div>

            {/* Cents Legend */}
            <div className="w-44 sm:w-52 flex justify-between text-[10px] font-bold text-slate-500 -mt-1">
              <span>-50♭</span>
              <span>-25</span>
              <span className="text-emerald-400">0</span>
              <span>+25</span>
              <span>+50♯</span>
            </div>

            {/* Detected Note Display */}
            <div className="text-center py-1 min-h-[60px] flex flex-col items-center justify-center">
              {isListening && livePitch && livePitch.detectedFreq > 0 ? (
                <div>
                  <div className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                    {notation === 'latin' ? livePitch.closestNote.nameLatin : livePitch.closestNote.nameScientific}
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                    <span className="text-[11px] font-semibold text-slate-400">
                      Frequenza: <strong className="text-indigo-300">{livePitch.detectedFreq} Hz</strong>
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        livePitch.inTune
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500 shadow-emerald-500/20 shadow-sm'
                          : livePitch.centsDiff < 0
                          ? 'bg-amber-950 text-amber-300 border border-amber-500'
                          : 'bg-purple-950 text-purple-300 border border-purple-500'
                      }`}
                    >
                      {livePitch.inTune ? '🎯 PERFETTO!' : livePitch.centsDiff < 0 ? `${livePitch.centsDiff} cents (Calante ♭)` : `+${livePitch.centsDiff} cents (Crescente ♯)`}
                    </span>
                  </div>
                </div>
              ) : isListening ? (
                <div className="flex flex-col items-center space-y-1">
                  <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs text-slate-400">In ascolto... canta una nota stabile</p>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Attiva il microfono per iniziare il test</p>
              )}
            </div>
          </div>

          {/* Vocal Pitch Waveform Graph */}
          <div className="mt-3 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Activity className="w-3 h-3 text-indigo-400" />
                Continuità della Nota (Hz)
              </span>
              <span className="text-[10px] text-slate-500">Onda armonica</span>
            </div>

            <div className="w-full h-24 bg-slate-900 rounded-xl border border-slate-800 p-1.5 overflow-hidden">
              <canvas ref={canvasRef} width={800} height={100} className="w-full h-full block"></canvas>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
